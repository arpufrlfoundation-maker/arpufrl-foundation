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
      referredBy: session.user.id,
      status: 'completed'
    })
      .populate('donorId', 'name email')
      .populate('referralCodeId', 'code type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalDonations = await Donation.countDocuments({
      referredBy: session.user.id,
      status: 'completed'
    })

    return NextResponse.json({
      donations: donations.map(donation => ({
        id: donation._id.toString(),
        amount: donation.amount,
        donor: donation.donorId ? {
          name: (donation.donorId as any).name,
          email: (donation.donorId as any).email
        } : null,
        referralCode: donation.referralCodeId ? {
          code: (donation.referralCodeId as any).code,
          type: (donation.referralCodeId as any).type
        } : null,
        date: donation.createdAt,
        status: donation.status
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
