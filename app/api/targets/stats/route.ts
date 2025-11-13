import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Target, TargetType, TargetStatus } from '@/models/Target'
import Transaction from '@/models/Transaction'
import { User } from '@/models/User'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    await connectToDatabase()

    // Check if user is admin or demo-admin
    const isAdmin = session.user.role === 'admin' || session.user.id.includes('demo-admin')
    
    // For admin users without a valid ObjectId, they might not have personal targets
    // Try to find targets assigned BY them instead, or return appropriate message
    let activeTarget = null
    
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId - find target assigned TO this user
      activeTarget = await Target.findOne({
        assignedTo: userId,
        type: TargetType.DONATION_AMOUNT,
        status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
      }).lean()
      
      // Manually populate assignedBy if it's a valid ObjectId
      if (activeTarget && activeTarget.assignedBy) {
        const assignedByStr = activeTarget.assignedBy.toString()
        if (assignedByStr.match(/^[0-9a-fA-F]{24}$/)) {
          const assignedByUser = await User.findById(activeTarget.assignedBy).select('name email').lean()
          if (assignedByUser) {
            // Cast to any to avoid TypeScript error with mixed types
            (activeTarget as any).assignedBy = {
              name: assignedByUser.name,
              email: assignedByUser.email
            }
          }
        } else {
          // It's a string like 'demo-admin', keep as is or set to null
          (activeTarget as any).assignedBy = null
        }
      }
    } else if (isAdmin) {
      // Admin/demo-admin - show organizational overview instead
      // Find any active target they've assigned or get organization stats
      const assignedTargets = await Target.find({
        assignedBy: session.user.id,
        type: TargetType.DONATION_AMOUNT,
        status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
      }).limit(1)
      
      if (assignedTargets.length === 0) {
        // No targets assigned by admin either
        return NextResponse.json({
          message: 'No active targets found. You can assign targets to your coordinators from the "Assign Target" tab.',
          hasTarget: false,
          isAdmin: true
        })
      }
      
      // Return empty/placeholder for admin - they should use leaderboard view
      return NextResponse.json({
        message: 'As an admin, please use the Leaderboard tab to view organizational performance.',
        hasTarget: false,
        isAdmin: true
      })
    } else {
      // Invalid ID and not admin
      return NextResponse.json({
        message: 'User ID is not valid. Please login with a valid coordinator account.',
        hasTarget: false,
        error: 'INVALID_USER_ID'
      }, { status: 200 })
    }

    if (!activeTarget) {
      return NextResponse.json({
        message: 'No active target found',
        hasTarget: false
      })
    }

    // Get hierarchy stats - wrap in try-catch to handle errors
    let hierarchyStats
    try {
      // Convert userId to ObjectId if it's a valid hex string
      const userObjectId = userId.match(/^[0-9a-fA-F]{24}$/) 
        ? new mongoose.Types.ObjectId(userId)
        : null
      
      if (userObjectId) {
        hierarchyStats = await (Target as any).getHierarchyStats(userObjectId)
      } else {
        // Fallback for non-ObjectId users (like demo-admin)
        hierarchyStats = {
          personalCollection: activeTarget.collectedAmount,
          teamCollection: activeTarget.teamCollectedAmount,
          totalCollection: activeTarget.collectedAmount + activeTarget.teamCollectedAmount,
          achievementPercentage: activeTarget.targetValue > 0
            ? Math.min(((activeTarget.collectedAmount + activeTarget.teamCollectedAmount) / activeTarget.targetValue) * 100, 100)
            : 0,
          subordinatesCount: 0,
          teamBreakdown: [],
          topPerformers: []
        }
      }
    } catch (error) {
      console.error('Error getting hierarchy stats:', error)
      // Provide fallback stats
      hierarchyStats = {
        personalCollection: activeTarget.collectedAmount,
        teamCollection: activeTarget.teamCollectedAmount,
        totalCollection: activeTarget.collectedAmount + activeTarget.teamCollectedAmount,
        achievementPercentage: activeTarget.targetValue > 0
          ? Math.min(((activeTarget.collectedAmount + activeTarget.teamCollectedAmount) / activeTarget.targetValue) * 100, 100)
          : 0,
        subordinatesCount: 0,
        teamBreakdown: [],
        topPerformers: []
      }
    }

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { userId: activeTarget.assignedTo, status: 'verified' } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          cashAmount: {
            $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$amount', 0] }
          },
          onlineAmount: {
            $sum: { $cond: [{ $eq: ['$paymentMode', 'online'] }, '$amount', 0] }
          }
        }
      }
    ])

    const txnStats = transactionStats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      cashAmount: 0,
      onlineAmount: 0
    }

    // Get pending transactions count
    const pendingCount = await Transaction.countDocuments({
      userId: activeTarget.assignedTo,
      status: 'pending'
    })

    // Get monthly collection trend
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          userId: activeTarget.assignedTo,
          status: 'verified',
          collectionDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // Current year
          }
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

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (new Date(activeTarget.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    )

    // Calculate remaining amount and total collection manually (since we used .lean())
    const totalCollected = activeTarget.collectedAmount + activeTarget.teamCollectedAmount
    const remainingAmount = Math.max(0, activeTarget.targetValue - totalCollected)
    const dailyAverageNeeded = daysRemaining > 0
      ? remainingAmount / daysRemaining
      : 0
    const completionPercentage = activeTarget.targetValue > 0
      ? Math.round((totalCollected / activeTarget.targetValue) * 100)
      : 0

    return NextResponse.json({
      hasTarget: true,
      target: {
        id: activeTarget._id,
        targetAmount: activeTarget.targetValue,
        collectedAmount: activeTarget.collectedAmount,
        teamCollectedAmount: activeTarget.teamCollectedAmount,
        totalCollected,
        remainingAmount,
        completionPercentage,
        status: activeTarget.status,
        startDate: activeTarget.startDate,
        endDate: activeTarget.endDate,
        daysRemaining,
        dailyAverageNeeded,
        description: activeTarget.description,
        level: activeTarget.level,
        region: activeTarget.region,
        assignedBy: activeTarget.assignedBy ? {
          name: (activeTarget.assignedBy as any).name,
          email: (activeTarget.assignedBy as any).email
        } : null
      },
      hierarchy: {
        personalCollection: hierarchyStats.personalCollection,
        teamCollection: hierarchyStats.teamCollection,
        totalCollection: hierarchyStats.totalCollection,
        achievementPercentage: hierarchyStats.achievementPercentage,
        subordinatesCount: hierarchyStats.subordinatesCount,
        teamBreakdown: hierarchyStats.teamBreakdown,
        topPerformers: hierarchyStats.topPerformers
      },
      transactions: {
        total: txnStats.totalTransactions,
        totalAmount: txnStats.totalAmount,
        cashAmount: txnStats.cashAmount,
        onlineAmount: txnStats.onlineAmount,
        pending: pendingCount
      },
      trends: {
        monthly: monthlyTrend.map(trend => ({
          month: trend._id.month,
          year: trend._id.year,
          amount: trend.amount,
          count: trend.count
        }))
      }
    })
  } catch (error: any) {
    console.error('Error fetching target stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
