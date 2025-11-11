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

    // Get referral code statistics
    const referralCodes = await ReferralCode.find({ ownerUserId: session.user.id })

    const totalDonations = referralCodes.reduce((sum, code) => sum + code.totalDonations, 0)
    const totalAmount = referralCodes.reduce((sum, code) => sum + code.totalAmount, 0)
    const activeReferrals = referralCodes.filter(code => code.active).length

    // Calculate this month's stats
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { Donation } = await import('@/models/Donation')

    const thisMonthDonations = await Donation.find({
      coordinatorId: session.user.id,
      createdAt: { $gte: firstDayOfMonth },
      paymentStatus: 'SUCCESS'
    })

    const thisMonthAmount = thisMonthDonations.reduce((sum: number, d: any) => sum + d.amount, 0)

    return NextResponse.json({
      totalReferrals: referralCodes.length,
      activeReferrals,
      totalDonations,
      totalAmount,
      thisMonthDonations: thisMonthDonations.length,
      thisMonthAmount
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
