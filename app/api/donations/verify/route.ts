import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { RazorpayService } from '@/lib/razorpay'
import { Donation } from '@/models/Donation'
import { Program } from '@/models/Program'
import { ReferralCode } from '@/models/ReferralCode'

// Payment verification schema
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  donationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid donation ID'),
})

// POST /api/donations/verify - Verify payment and update donation status
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = verifyPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = validationResult.data

    // Find the donation record
    const donation = await Donation.findById(donationId)
    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Check if donation is already processed
    if (donation.paymentStatus === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        data: {
          donationId: donation._id,
          paymentId: donation.razorpayPaymentId,
          amount: donation.amount,
          status: donation.paymentStatus
        }
      })
    }

    // Verify the order ID matches
    if (donation.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID mismatch' },
        { status: 400 }
      )
    }

    // Verify payment signature with Razorpay
    const isSignatureValid = RazorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })

    if (!isSignatureValid) {
      // Mark donation as failed
      await donation.markAsFailed('Invalid payment signature')

      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Payment is valid - update donation status
    await donation.markAsSuccessful(razorpay_payment_id, razorpay_signature)

    // Update program funding stats if donation is for a specific program
    if (donation.programId) {
      try {
        const program = await Program.findById(donation.programId)
        if (program) {
          await program.updateFundingStats()
        }
      } catch (error) {
        console.error('Error updating program stats:', error)
        // Don't fail the payment verification for this
      }
    }

    // Update referral code stats if applicable
    if (donation.referralCodeId) {
      try {
        const referralCode = await ReferralCode.findById(donation.referralCodeId)
        if (referralCode) {
          referralCode.totalDonations += 1
          referralCode.totalAmount += donation.amount
          referralCode.lastUsed = new Date()
          await referralCode.save()
        }
      } catch (error) {
        console.error('Error updating referral stats:', error)
        // Don't fail the payment verification for this
      }
    }

    // Fetch updated donation with populated fields for response
    const updatedDonation = await Donation.findById(donation._id)
      .populate('programId', 'name slug')
      .populate('referralCodeId', 'code')

    if (!updatedDonation) {
      return NextResponse.json(
        { error: 'Donation not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        donationId: updatedDonation._id,
        paymentId: razorpay_payment_id,
        amount: updatedDonation.amount,
        currency: updatedDonation.currency,
        donorName: updatedDonation.donorName,
        donorEmail: updatedDonation.donorEmail,
        programName: (updatedDonation.programId as any)?.name,
        referralCode: (updatedDonation.referralCodeId as any)?.code,
        status: updatedDonation.paymentStatus,
        createdAt: updatedDonation.createdAt
      }
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}