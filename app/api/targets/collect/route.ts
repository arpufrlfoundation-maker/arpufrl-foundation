import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target from '@/models/Target'
import { User } from '@/models/User'
import Transaction from '@/models/Transaction'
import mongoose from 'mongoose'

/**
 * POST /api/targets/collect
 * Record a collection and update target progress with upward propagation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Handle demo-admin
    if (session.user.id === 'demo-admin') {
      return NextResponse.json(
        { error: 'Demo admin cannot record collections' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      amount,
      paymentMode,
      transactionId,
      receiptNumber,
      donorName,
      donorContact,
      donorEmail,
      purpose,
      notes,
      attachments
    } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!paymentMode) {
      return NextResponse.json(
        { error: 'Payment mode is required' },
        { status: 400 }
      )
    }

    // Get the current user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's active target
    const activeTarget = await Target.findActiveByUser(new mongoose.Types.ObjectId(session.user.id))

    if (!activeTarget) {
      return NextResponse.json(
        { error: 'No active target found. Please request a target assignment first.' },
        { status: 404 }
      )
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: user._id,
      collectedBy: user._id,
      amount,
      paymentMode,
      transactionId,
      receiptNumber,
      donorName,
      donorContact,
      donorEmail,
      purpose,
      notes,
      attachments,
      targetId: activeTarget._id,
      status: 'verified', // Auto-verify for now, can be changed to pending if approval needed
      verifiedAt: new Date(),
      collectionDate: new Date()
    })

    // Update user's personal collection
    activeTarget.personalCollection += amount
    await activeTarget.save()

    // Propagate collection upward through hierarchy
    await propagateCollectionUpward(user._id, amount)

    // Get updated target with current stats
    const updatedTarget = await Target.findById(activeTarget._id)
      .populate('assignedBy', 'name email role')

    return NextResponse.json({
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} collected successfully`,
      transaction,
      target: {
        targetAmount: updatedTarget?.targetAmount,
        personalCollection: updatedTarget?.personalCollection,
        teamCollection: updatedTarget?.teamCollection,
        totalCollection: updatedTarget?.totalCollection,
        remainingAmount: updatedTarget?.remainingAmount,
        progressPercentage: updatedTarget?.progressPercentage,
        status: updatedTarget?.status
      }
    })

  } catch (error: any) {
    console.error('Error recording collection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record collection' },
      { status: 500 }
    )
  }
}

/**
 * Propagate collection amount upward through the hierarchy
 */
async function propagateCollectionUpward(userId: mongoose.Types.ObjectId, amount: number) {
  try {
    // Find user's parent
    const user = await User.findById(userId).select('parentCoordinatorId')
    if (!user || !user.parentCoordinatorId) {
      return // Reached top of hierarchy
    }

    // Find parent's active target
    const parentTarget = await Target.findActiveByUser(user.parentCoordinatorId)
    if (!parentTarget) {
      return // Parent has no active target
    }

    // Recalculate parent's team collection from all subordinates
    const teamCollection = await Target.aggregateTeamCollection(user.parentCoordinatorId)
    parentTarget.teamCollection = teamCollection
    await parentTarget.save()

    // Continue propagating upward
    await propagateCollectionUpward(user.parentCoordinatorId, amount)
  } catch (error) {
    console.error('Error propagating collection:', error)
    // Don't throw - we want the original collection to succeed even if propagation fails
  }
}
