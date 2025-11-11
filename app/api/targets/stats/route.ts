import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Target, TargetType, TargetStatus } from '@/models/Target'
import Transaction from '@/models/Transaction'
import { User } from '@/models/User'

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

    // Get user's active target
    const activeTarget = await Target.findOne({
      assignedTo: userId,
      type: TargetType.DONATION_AMOUNT,
      status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
    }).populate('assignedBy', 'name email')

    if (!activeTarget) {
      return NextResponse.json({
        message: 'No active target found',
        hasTarget: false
      })
    }

    // Get hierarchy stats
    const hierarchyStats = await (Target as any).getHierarchyStats(userId)

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

    // Calculate daily average needed
    const remainingAmount = activeTarget.getRemainingAmount()
    const dailyAverageNeeded = daysRemaining > 0
      ? remainingAmount / daysRemaining
      : 0

    return NextResponse.json({
      hasTarget: true,
      target: {
        id: activeTarget._id,
        targetAmount: activeTarget.targetValue,
        collectedAmount: activeTarget.collectedAmount,
        teamCollectedAmount: activeTarget.teamCollectedAmount,
        totalCollected: activeTarget.getTotalCollection(),
        remainingAmount,
        completionPercentage: activeTarget.targetValue > 0 
          ? Math.round((activeTarget.getTotalCollection() / activeTarget.targetValue) * 100) 
          : 0,
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
