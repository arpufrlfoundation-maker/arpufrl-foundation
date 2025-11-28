import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { CommissionLog } from '@/models/CommissionLog'
import { getUserCommissionSummary } from '@/lib/commission-utils'
import mongoose from 'mongoose'

/**
 * GET /api/revenue/commissions
 * Get commission logs for current user or all (admin)
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    // Check if admin
    const isAdmin = session.user.id === 'demo-admin' || session.user.role === 'ADMIN'

    let query: any = {}

    // Validate ObjectId format before using
    const isValidObjectId = (id: string) => {
      return mongoose.Types.ObjectId.isValid(id) && id.length === 24
    }

    // If not admin, only show own commissions
    if (!isAdmin) {
      if (!isValidObjectId(session.user.id)) {
        // Return empty data for invalid user IDs (demo users etc)
        return NextResponse.json({
          success: true,
          commissions: [],
          summary: {
            totalEarned: 0,
            pending: 0,
            paid: 0,
            failed: 0,
            commissionCount: 0
          }
        })
      }
      query.userId = new mongoose.Types.ObjectId(session.user.id)
    } else if (userId && isValidObjectId(userId)) {
      // Admin can query specific user
      query.userId = new mongoose.Types.ObjectId(userId)
    }

    if (status) {
      query.status = status
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const commissions = await CommissionLog.find(query)
      .populate('userId', 'name email role')
      .populate('donationId', 'amount donorName donorEmail createdAt')
      .sort({ createdAt: -1 })
      .limit(100)

    // Get summary
    let summary = {
      totalEarned: 0,
      pending: 0,
      paid: 0,
      failed: 0,
      commissionCount: 0
    }

    try {
      const summaryUserId = userId && isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : isAdmin
          ? undefined
          : isValidObjectId(session.user.id)
            ? new mongoose.Types.ObjectId(session.user.id)
            : undefined

      if (summaryUserId) {
        const rawSummary = await getUserCommissionSummary(
          summaryUserId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        )
        if (rawSummary) {
          summary = {
            totalEarned: rawSummary.totalEarned || 0,
            pending: rawSummary.pending || 0,
            paid: rawSummary.paid || 0,
            failed: 0, // Not tracked in getUserCommissionSummary
            commissionCount: rawSummary.count || 0
          }
        }
      } else if (isAdmin && CommissionLog.getTotalCommissions) {
        const adminSummary = await CommissionLog.getTotalCommissions(query)
        if (adminSummary) {
          summary = {
            totalEarned: adminSummary.total || 0,
            pending: 0,
            paid: adminSummary.total || 0,
            failed: 0,
            commissionCount: adminSummary.count || 0
          }
        }
      }
    } catch (summaryError) {
      console.error('Error fetching summary:', summaryError)
      // Keep default empty summary
    }

    return NextResponse.json({
      success: true,
      commissions,
      summary
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
