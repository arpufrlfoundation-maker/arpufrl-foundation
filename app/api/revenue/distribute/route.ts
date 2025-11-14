import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { processCommissionDistribution } from '@/lib/commission-utils'
import mongoose from 'mongoose'

/**
 * POST /api/revenue/distribute
 * Distribute commission for a donation (auto or manual)
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

    const body = await req.json()
    const { donationId } = body

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    // Get donation
    const donation = await Donation.findById(donationId)
      .populate('attributedToUserId', 'name role')

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Check if already distributed
    if (donation.distributed) {
      return NextResponse.json(
        { error: 'Commission already distributed for this donation' },
        { status: 400 }
      )
    }

    // Check if donation is successful
    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Cannot distribute commission for unsuccessful donation' },
        { status: 400 }
      )
    }

    // Check if attributed to a user
    if (!donation.attributedToUserId) {
      return NextResponse.json(
        { error: 'Donation not attributed to any user' },
        { status: 400 }
      )
    }

    // Process commission distribution
    const result = await processCommissionDistribution(
      donation._id,
      donation.attributedToUserId,
      donation.amount
    )

    // Update donation record
    await Donation.findByIdAndUpdate(donationId, {
      distributed: true,
      distributedAt: new Date(),
      totalCommissionDistributed: result.totalCommission,
      organizationFundAmount: result.organizationFund
    })

    return NextResponse.json({
      success: true,
      message: 'Commission distributed successfully',
      data: {
        totalCommission: result.totalCommission,
        organizationFund: result.organizationFund,
        distributions: result.distributions,
        summary: result.summary
      }
    })

  } catch (error: any) {
    console.error('Error distributing commission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to distribute commission' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/revenue/distribute
 * Get undistributed donations
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

    // Get undistributed successful donations
    const undistributedDonations = await Donation.find({
      paymentStatus: 'SUCCESS',
      distributed: false,
      attributedToUserId: { $ne: null }
    })
      .populate('attributedToUserId', 'name email role')
      .populate('programId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json({
      success: true,
      donations: undistributedDonations,
      count: undistributedDonations.length
    })

  } catch (error: any) {
    console.error('Error fetching undistributed donations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch undistributed donations' },
      { status: 500 }
    )
  }
}
