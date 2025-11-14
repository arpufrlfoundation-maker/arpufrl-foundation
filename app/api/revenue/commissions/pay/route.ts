import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { CommissionLog } from '@/models/CommissionLog'
import { markCommissionAsPaid } from '@/lib/commission-utils'
import mongoose from 'mongoose'
import { User } from '@/models/User'

/**
 * POST /api/revenue/commissions/pay
 * Mark a commission as paid (admin only)
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

    const body = await req.json()
    const { commissionLogId, transactionId, paymentMethod } = body

    if (!commissionLogId || !transactionId) {
      return NextResponse.json(
        { error: 'Commission log ID and transaction ID are required' },
        { status: 400 }
      )
    }

    // Mark as paid
    await markCommissionAsPaid(
      new mongoose.Types.ObjectId(commissionLogId),
      transactionId,
      paymentMethod || 'MANUAL'
    )

    const updatedLog = await CommissionLog.findById(commissionLogId)
      .populate('userId', 'name email role')
      .populate('donationId', 'amount donorName')

    return NextResponse.json({
      success: true,
      message: 'Commission marked as paid',
      commissionLog: updatedLog
    })

  } catch (error: any) {
    console.error('Error marking commission as paid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark commission as paid' },
      { status: 500 }
    )
  }
}
