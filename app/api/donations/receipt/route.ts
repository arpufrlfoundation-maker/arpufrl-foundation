import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { sendDonationConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const { donationId } = await request.json()

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    // Get donation details
    const donation = await Donation.findById(donationId).populate('programId') as any

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    if (!donation.donorEmail) {
      return NextResponse.json(
        { error: 'No email address associated with this donation' },
        { status: 400 }
      )
    }

    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Only successful donations can have receipts sent' },
        { status: 400 }
      )
    }

    // Send the confirmation email as receipt
    const emailSent = await sendDonationConfirmationEmail(
      donation.donorEmail,
      donation.donorName,
      donation.amount,
      donation.programId?.name || 'General Fund',
      donation._id.toString(),
      donation.razorpayPaymentId,
      donation.referralCode
    )

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Receipt sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send receipt email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending receipt:', error)
    return NextResponse.json(
      { error: 'Failed to send receipt' },
      { status: 500 }
    )
  }
}
