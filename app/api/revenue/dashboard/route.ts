import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { getOrganizationCommissionSummary } from '@/lib/commission-utils'
import { User } from '@/models/User'
import { CommissionLog } from '@/models/CommissionLog'
import mongoose from 'mongoose'

/**
 * GET /api/revenue/dashboard
 * Get revenue distribution dashboard data (admin only)
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

    // Check if admin
    if (session.user.id !== 'demo-admin') {
      const user = await User.findById(session.user.id)
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        )
      }
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get organization summary
    const summary = await getOrganizationCommissionSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Get top earners
    const topEarners = await CommissionLog.aggregate([
      {
        $match: {
          status: { $in: ['PENDING', 'PAID'] },
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: '$userId',
          totalCommission: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' }
        }
      },
      { $sort: { totalCommission: -1 } },
      { $limit: 10 }
    ])

    // Get commission breakdown by role
    const roleBreakdown = await CommissionLog.aggregate([
      {
        $match: {
          status: { $in: ['PENDING', 'PAID'] },
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: '$userRole',
          totalCommission: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
          avgCommission: { $avg: '$commissionAmount' }
        }
      },
      { $sort: { totalCommission: -1 } }
    ])

    // Get recent commissions
    const recentCommissions = await CommissionLog.find({
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    })
      .populate('userId', 'name email role')
      .populate('donationId', 'amount donorName createdAt')
      .sort({ createdAt: -1 })
      .limit(20)

    // Get pending payments summary
    const pendingPayments = await CommissionLog.aggregate([
      {
        $match: {
          status: 'PENDING',
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPending: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' }
        }
      },
      { $sort: { totalPending: -1 } },
      { $limit: 20 }
    ])

    return NextResponse.json({
      success: true,
      data: {
        summary,
        topEarners,
        roleBreakdown,
        recentCommissions,
        pendingPayments
      }
    })

  } catch (error: any) {
    console.error('Error fetching revenue dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch revenue dashboard' },
      { status: 500 }
    )
  }
}
