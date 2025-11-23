import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { ReferralCode } from '@/models/ReferralCode'
import { User } from '@/models/User'

/**
 * GET /api/donations/by-referral
 * Get donations made via a specific referral code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referralCode = searchParams.get('referralCode')

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find referral code in ReferralCode collection
    let referralCodeDoc = await ReferralCode.findOne({
      code: referralCode.toUpperCase()
    })

    // If not found, try User.referralCode as fallback
    if (!referralCodeDoc) {
      const userWithCode = await User.findOne({
        referralCode: referralCode.toUpperCase()
      })

      if (!userWithCode) {
        return NextResponse.json({
          donations: [],
          stats: {
            total: 0,
            totalAmount: 0,
            thisMonth: 0
          }
        })
      }

      // Find donations with this referral code
      const donations = await Donation.find({
        status: 'SUCCESS',
        $or: [
          { referralCodeId: userWithCode._id },
          { referredBy: userWithCode._id }
        ]
      })
        .populate('programId', 'title')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()

      // Calculate stats
      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)

      const thisMonthDonations = donations.filter(
        d => new Date(d.createdAt) >= currentMonth
      )

      return NextResponse.json({
        donations: donations.map(d => ({
          _id: d._id.toString(),
          donorName: d.donorName,
          amount: d.amount,
          createdAt: d.createdAt,
          programId: d.programId,
          status: 'SUCCESS'
        })),
        stats: {
          total: donations.length,
          totalAmount,
          thisMonth: thisMonthDonations.length
        }
      })
    }

    // Find donations using this referral code
    const donations = await Donation.find({
      referralCodeId: referralCodeDoc._id,
      status: 'SUCCESS'
    })
      .populate('programId', 'title')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Calculate stats
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const thisMonthDonations = donations.filter(
      d => new Date(d.createdAt) >= currentMonth
    )

    return NextResponse.json({
      donations: donations.map(d => ({
        _id: d._id.toString(),
        donorName: d.donorName,
        amount: d.amount,
        createdAt: d.createdAt,
        programId: d.programId,
        status: 'SUCCESS'
      })),
      stats: {
        total: donations.length,
        totalAmount,
        thisMonth: thisMonthDonations.length
      }
    })

  } catch (error) {
    console.error('Error fetching donations by referral:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}
