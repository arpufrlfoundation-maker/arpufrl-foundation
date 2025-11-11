import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Get donations that used this coordinator's referral codes
    const donations = await Donation.find({
      attributedToUserId: session.user.id,
      paymentStatus: 'completed'
    })
      .populate('referralCodeId', 'code type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalDonations = await Donation.countDocuments({
      attributedToUserId: session.user.id,
      paymentStatus: 'completed'
    })

    return NextResponse.json({
      donations: donations.map(donation => ({
        id: donation._id.toString(),
        amount: donation.amount,
        donor: {
          name: donation.donorName,
          email: donation.donorEmail
        },
        referralCode: donation.referralCodeId ? {
          code: (donation.referralCodeId as any).code,
          type: (donation.referralCodeId as any).type
        } : null,
        date: donation.createdAt,
        status: donation.paymentStatus
      })),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalDonations / limit),
        totalDonations
      }
    })
  } catch (error) {
    console.error('Error fetching referral donations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
