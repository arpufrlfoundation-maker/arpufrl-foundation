import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'

// Payment failure schema
const failPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  error_code: z.string().optional(),
  error_description: z.string().optional(),
  error_source: z.string().optional(),
  error_step: z.string().optional(),
  error_reason: z.string().optional(),
})

// POST /api/donations/fail - Handle payment failure
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = failPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid failure data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const {
      razorpay_order_id,
      error_code,
      error_description,
      error_source,
      error_step,
      error_reason
    } = validationResult.data

    // Find donation by order ID
    const donation = await Donation.findByRazorpayOrderId(razorpay_order_id)
    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Check if donation is already processed
    if (donation.paymentStatus === 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Cannot mark successful payment as failed' },
        { status: 400 }
      )
    }

    // Create failure reason string
    const failureReason = [
      error_code && `Code: ${error_code}`,
      error_description && `Description: ${error_description}`,
      error_source && `Source: ${error_source}`,
      error_step && `Step: ${error_step}`,
      error_reason && `Reason: ${error_reason}`
    ].filter(Boolean).join('; ') || 'Payment failed'

    // Mark donation as failed
    await donation.markAsFailed(failureReason)

    return NextResponse.json({
      success: true,
      data: {
        donation: {
          id: donation._id,
          paymentStatus: donation.paymentStatus,
          failureReason
        }
      }
    })

  } catch (error) {
    console.error('Error handling payment failure:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment failure',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}