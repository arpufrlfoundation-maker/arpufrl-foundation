import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target, { TargetStatus } from '@/models/Target'
import Transaction from '@/models/Transaction'
import { User } from '@/models/User'
import mongoose from 'mongoose'

/**
 * GET /api/targets/stats
 * Get comprehensive target statistics for the authenticated user
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
    const userIdParam = searchParams.get('userId')

    // Determine target user ID
    let targetUserId: string | null = null

    if (session.user.id === 'demo-admin') {
      if (userIdParam) {
        targetUserId = userIdParam
      } else {
        return NextResponse.json({
          hasTarget: false,
          isAdmin: true,
          message: 'Admin view - select a user to view their stats'
        })
      }
    } else {
      targetUserId = userIdParam || session.user.id

      // Verify the session user has permission to view this user's stats
      if (targetUserId !== session.user.id) {
        const sessionUser = await User.findById(session.user.id)
        if (!sessionUser || sessionUser.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }
      }
    }

    // Get user information
    const user = await User.findById(targetUserId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find active target for the user
    const target = await Target.findOne({
      assignedTo: targetUserId,
      status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
    })
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 })

    if (!target) {
      return NextResponse.json({
        hasTarget: false,
        message: 'No active target assigned',
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    }

    // Calculate days remaining
    const now = new Date()
    const endDate = new Date(target.endDate)
    const startDate = new Date(target.startDate)
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate collected amounts
    const personalCollection = target.collectedAmount || 0
    const teamCollection = target.teamCollectedAmount || 0
    const totalCollected = personalCollection + teamCollection

    // Calculate remaining and percentage
    const remainingAmount = Math.max(0, target.targetAmount - totalCollected)
    const completionPercentage = target.targetAmount > 0
      ? (totalCollected / target.targetAmount) * 100
      : 0

    // Calculate daily average needed
    const dailyAverageNeeded = daysRemaining > 0
      ? remainingAmount / daysRemaining
      : remainingAmount

    // Get hierarchy statistics (subordinates' collection)
    const subordinates = await User.find({
      $or: [
        { addedBy: targetUserId },
        { coordinator: targetUserId },
        { reportingTo: targetUserId }
      ]
    }).select('_id name email role')

    const subordinateIds = subordinates.map(s => s._id)

    // Get subordinates' targets and collections
    const subordinateTargets = await Target.find({
      assignedTo: { $in: subordinateIds }
    }).select('assignedTo collectedAmount teamCollectedAmount')

    const teamBreakdown = subordinates.map(sub => {
      const subTarget = subordinateTargets.find(
        t => t.assignedTo.toString() === sub._id.toString()
      )
      const collected = subTarget
        ? (subTarget.collectedAmount || 0) + (subTarget.teamCollectedAmount || 0)
        : 0
      const percentage = target.targetAmount > 0
        ? (collected / target.targetAmount) * 100
        : 0

      return {
        userId: sub._id.toString(),
        name: sub.name,
        level: sub.role,
        collected,
        percentage
      }
    }).sort((a, b) => b.collected - a.collected)

    // Get top performers
    const topPerformers = teamBreakdown.slice(0, 5).map(t => ({
      userId: t.userId,
      name: t.name,
      collected: t.collected
    }))

    // Get transaction statistics
    const transactions = await Transaction.find({
      collectedBy: targetUserId,
      status: 'verified'
    })

    const transactionStats = {
      total: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      cashAmount: transactions
        .filter(t => t.paymentMode === 'cash')
        .reduce((sum, t) => sum + t.amount, 0),
      onlineAmount: transactions
        .filter(t => ['online', 'upi', 'bank_transfer'].includes(t.paymentMode))
        .reduce((sum, t) => sum + t.amount, 0),
      pending: await Transaction.countDocuments({
        collectedBy: targetUserId,
        status: 'pending'
      })
    }

    // Get monthly trends
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          collectedBy: new mongoose.Types.ObjectId(targetUserId),
          status: 'verified',
          collectionDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$collectionDate' },
            year: { $year: '$collectionDate' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    const trends = monthlyTransactions.map(m => ({
      month: m._id.month,
      year: m._id.year,
      amount: m.amount,
      count: m.count
    }))

    // Prepare response
    const response = {
      hasTarget: true,
      target: {
        id: target._id.toString(),
        targetAmount: target.targetAmount,
        collectedAmount: personalCollection,
        teamCollectedAmount: teamCollection,
        totalCollected,
        remainingAmount,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        status: target.status,
        startDate: target.startDate.toISOString(),
        endDate: target.endDate.toISOString(),
        daysRemaining,
        totalDays,
        dailyAverageNeeded: Math.round(dailyAverageNeeded),
        description: target.description,
        level: target.level,
        assignedBy: target.assignedBy ? {
          name: target.assignedBy.name,
          email: target.assignedBy.email
        } : null
      },
      hierarchy: {
        personalCollection,
        teamCollection,
        totalCollection: totalCollected,
        achievementPercentage: completionPercentage,
        subordinatesCount: subordinates.length,
        teamBreakdown,
        topPerformers
      },
      transactions: transactionStats,
      trends
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching target stats:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
