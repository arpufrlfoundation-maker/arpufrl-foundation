import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'

// GET /api/donations/[id] - Fetch individual donation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { id: donationId } = await params

    // Validate donation ID format
    if (!donationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation ID format' },
        { status: 400 }
      )
    }

    // Find donation with populated fields
    const donation = await Donation.findById(donationId)
      .populate('programId', 'name slug')
      .populate('referralCodeId', 'code')
      .populate('attributedToUserId', 'name email')

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Only return successful donations for public access
    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Donation not completed' },
        { status: 404 }
      )
    }

    // Prepare response data
    const responseData = {
      donationId: donation._id,
      paymentId: donation.razorpayPaymentId,
      amount: donation.amount,
      currency: donation.currency,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      programId: donation.programId,
      referralCodeId: donation.referralCodeId,
      status: donation.paymentStatus,
      createdAt: donation.createdAt
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error fetching donation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch donation details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Other methods not allowed
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}