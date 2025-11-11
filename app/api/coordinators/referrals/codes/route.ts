import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { ReferralCode } from '@/models/ReferralCode'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get all referral codes for the coordinator
    const codes = await ReferralCode.find({ ownerUserId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      codes: codes.map(code => ({
        id: code._id.toString(),
        code: code.code,
        type: code.type,
        active: code.active,
        totalDonations: code.totalDonations,
        totalAmount: code.totalAmount,
        lastUsed: code.lastUsed,
        createdAt: code.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching referral codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
