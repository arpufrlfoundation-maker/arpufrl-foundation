import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target, { TargetStatus } from '@/models/Target'
import mongoose from 'mongoose'

/**
 * GET /api/targets
 * Get all targets for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const includeHistory = searchParams.get('includeHistory') === 'true'

    // Handle demo-admin - they can view all targets
    let userId: mongoose.Types.ObjectId
    if (session.user.id === 'demo-admin') {
      // For admin, return all targets
      const targets = await Target.find({})
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(100)

      return NextResponse.json({
        success: true,
        targets,
        summary: {
          totalTargets: targets.length,
          active: targets.filter((t: any) => t.status === TargetStatus.IN_PROGRESS).length,
          completed: targets.filter((t: any) => t.status === TargetStatus.COMPLETED).length,
          pending: targets.filter((t: any) => t.status === TargetStatus.PENDING).length
        }
      })
    }

    userId = new mongoose.Types.ObjectId(session.user.id)

    let targets
    if (status === 'active') {
      // Get only active target
      targets = [await Target.findActiveByUser(userId)].filter(Boolean)
    } else if (includeHistory) {
      // Get all targets including completed and cancelled
      targets = await Target.findByUser(userId)
    } else {
      // Get active and pending targets
      targets = await Target.find({
        assignedTo: userId,
        status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS, TargetStatus.OVERDUE] }
      })
        .populate('assignedBy', 'name email role')
        .sort({ createdAt: -1 })
    }

    // Get summary
    const summary = await Target.getTargetSummary(userId)

    return NextResponse.json({
      success: true,
      targets,
      summary
    })

  } catch (error: any) {
    console.error('Error fetching targets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch targets' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/targets
 * Update a target (status, notes, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await req.json()
    const { targetId, status, notes } = body

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      )
    }

    // Find the target
    const target = await Target.findById(targetId)
    if (!target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    // Check if user owns this target or is the assigner
    const userId = session.user.id
    if (target.assignedTo.toString() !== userId && target.assignedBy?.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this target' },
        { status: 403 }
      )
    }

    // Update fields
    if (status) {
      target.status = status
    }
    if (notes) {
      target.notes = notes
    }

    await target.save()

    return NextResponse.json({
      success: true,
      message: 'Target updated successfully',
      target
    })

  } catch (error: any) {
    console.error('Error updating target:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update target' },
      { status: 500 }
    )
  }
}
