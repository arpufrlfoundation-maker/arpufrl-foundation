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

    // If not admin, only show own commissions
    if (!isAdmin) {
      query.userId = new mongoose.Types.ObjectId(session.user.id)
    } else if (userId) {
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
    const summaryUserId = userId
      ? new mongoose.Types.ObjectId(userId)
      : isAdmin
        ? undefined
        : new mongoose.Types.ObjectId(session.user.id)

    const summary = summaryUserId
      ? await getUserCommissionSummary(
          summaryUserId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        )
      : await CommissionLog.getTotalCommissions(query)

    return NextResponse.json({
      success: true,
      commissions,
      summary
    })

  } catch (error: any) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
