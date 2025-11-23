import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { RazorpayService, WebhookEvent } from '@/lib/razorpay'
import { Donation } from '@/models/Donation'
import { ReferralCode } from '@/models/ReferralCode'
import { Program } from '@/models/Program'
import { ReferralAttributionService } from '@/lib/referral-attribution'

// Webhook event processing status
interface WebhookProcessingResult {
  success: boolean
  message: string
  donationId?: string
  processed?: boolean
}

// POST /api/webhooks - Handle Razorpay webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('Missing Razorpay signature header')
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const isValidSignature = RazorpayService.verifyWebhookSignature(body, signature)
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook event
    let webhookEvent: WebhookEvent
    try {
      const parsedBody = JSON.parse(body)
      const validatedEvent = RazorpayService.validateWebhookEvent(parsedBody)

      if (!validatedEvent) {
        console.error('Invalid webhook event format:', parsedBody)
        return NextResponse.json(
          { success: false, error: 'Invalid event format' },
          { status: 400 }
        )
      }

      webhookEvent = validatedEvent
    } catch (error) {
      console.error('Error parsing webhook body:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Process webhook event based on type
    const result = await processWebhookEvent(webhookEvent)

    // Log webhook processing result
    console.log('Webhook processed:', {
      event: webhookEvent.event,
      accountId: webhookEvent.account_id,
      result
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Process different types of webhook events
async function processWebhookEvent(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const eventType = event.event

  switch (eventType) {
    case 'payment.captured':
      return await handlePaymentCaptured(event)

    case 'payment.failed':
      return await handlePaymentFailed(event)

    case 'payment.authorized':
      return await handlePaymentAuthorized(event)

    case 'order.paid':
      return await handleOrderPaid(event)

    case 'refund.created':
      return await handleRefundCreated(event)

    case 'refund.processed':
      return await handleRefundProcessed(event)

    default:
      // Unhandled webhook event type
      return {
        success: true,
        message: `Event type ${eventType} acknowledged but not processed`
      }
  }
}

// Handle payment captured event
async function handlePaymentCaptured(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const paymentData = RazorpayService.getPaymentStatusFromWebhook(event)

  if (!paymentData || !paymentData.orderId) {
    return {
      success: false,
      message: 'Invalid payment data in webhook'
    }
  }

  // Find donation by order ID
  const donation = await Donation.findByRazorpayOrderId(paymentData.orderId)
  if (!donation) {
    return {
      success: false,
      message: `Donation not found for order ID: ${paymentData.orderId}`
    }
  }

  // Check if already processed (idempotency)
  if (donation.paymentStatus === 'SUCCESS' && donation.razorpayPaymentId === paymentData.paymentId) {
    return {
      success: true,
      message: 'Payment already processed',
      donationId: donation._id.toString(),
      processed: false
    }
  }

  // Verify payment amount matches
  if (donation.amount !== paymentData.amount) {
    console.error('Payment amount mismatch:', {
      donationAmount: donation.amount,
      webhookAmount: paymentData.amount,
      orderId: paymentData.orderId
    })

    await donation.markAsFailed('Amount mismatch in webhook')
    return {
      success: false,
      message: 'Payment amount mismatch'
    }
  }

  // Mark donation as successful
  await donation.markAsSuccessful(paymentData.paymentId, 'webhook_verified')

  // Update program funding
  if (donation.programId) {
    try {
      const program = await Program.findById(donation.programId)
      if (program) {
        program.raisedAmount += donation.amount
        program.donationCount += 1
        await program.save()
      }
    } catch (error) {
      console.error('Error updating program stats in webhook:', error)
    }
  }

  // Update referral code stats and attribution
  if (donation.referralCodeId) {
    try {
      await ReferralAttributionService.updateReferralStats(donation.referralCodeId)
    } catch (error) {
      console.error('Error updating referral code stats in webhook:', error)
    }
  }

  return {
    success: true,
    message: 'Payment captured successfully',
    donationId: donation._id.toString(),
    processed: true
  }
}

// Handle payment failed event
async function handlePaymentFailed(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const paymentData = RazorpayService.getPaymentStatusFromWebhook(event)

  if (!paymentData || !paymentData.orderId) {
    return {
      success: false,
      message: 'Invalid payment data in webhook'
    }
  }

  // Find donation by order ID
  const donation = await Donation.findByRazorpayOrderId(paymentData.orderId)
  if (!donation) {
    return {
      success: false,
      message: `Donation not found for order ID: ${paymentData.orderId}`
    }
  }

  // Check if already processed (idempotency)
  if (donation.paymentStatus === 'FAILED') {
    return {
      success: true,
      message: 'Payment failure already processed',
      donationId: donation._id.toString(),
      processed: false
    }
  }

  // Create failure reason from webhook data
  const failureReason = [
    paymentData.errorCode && `Code: ${paymentData.errorCode}`,
    paymentData.errorDescription && `Description: ${paymentData.errorDescription}`
  ].filter(Boolean).join('; ') || 'Payment failed (webhook)'

  // Mark donation as failed
  await donation.markAsFailed(failureReason)

  return {
    success: true,
    message: 'Payment failure processed',
    donationId: donation._id.toString(),
    processed: true
  }
}

// Handle payment authorized event (for manual capture)
async function handlePaymentAuthorized(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const paymentData = RazorpayService.getPaymentStatusFromWebhook(event)

  if (!paymentData || !paymentData.orderId) {
    return {
      success: false,
      message: 'Invalid payment data in webhook'
    }
  }

  // Find donation by order ID
  const donation = await Donation.findByRazorpayOrderId(paymentData.orderId)
  if (!donation) {
    return {
      success: false,
      message: `Donation not found for order ID: ${paymentData.orderId}`
    }
  }

  // Update payment ID if not already set
  if (!donation.razorpayPaymentId) {
    donation.razorpayPaymentId = paymentData.paymentId
    await donation.save()
  }

  return {
    success: true,
    message: 'Payment authorization recorded',
    donationId: donation._id.toString(),
    processed: true
  }
}

// Handle order paid event
async function handleOrderPaid(event: WebhookEvent): Promise<WebhookProcessingResult> {
  // This is typically fired after payment.captured, so we can use similar logic
  return await handlePaymentCaptured(event)
}

// Handle refund created event
async function handleRefundCreated(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const paymentData = RazorpayService.getPaymentStatusFromWebhook(event)

  if (!paymentData) {
    return {
      success: false,
      message: 'Invalid payment data in webhook'
    }
  }

  // Find donation by payment ID
  const donation = await Donation.findOne({ razorpayPaymentId: paymentData.paymentId })
  if (!donation) {
    return {
      success: false,
      message: `Donation not found for payment ID: ${paymentData.paymentId}`
    }
  }

  // Update donation status to refunded
  donation.paymentStatus = 'REFUNDED'
  await donation.save()

  // Update program funding (subtract refunded amount)
  if (donation.programId) {
    try {
      const program = await Program.findById(donation.programId)
      if (program) {
        program.raisedAmount = Math.max(0, program.raisedAmount - donation.amount)
        program.donationCount = Math.max(0, program.donationCount - 1)
        await program.save()
      }
    } catch (error) {
      console.error('Error updating program stats for refund:', error)
    }
  }

  // Update referral code stats
  if (donation.referralCodeId) {
    try {
      await ReferralAttributionService.updateReferralStats(donation.referralCodeId)
    } catch (error) {
      console.error('Error updating referral code stats for refund:', error)
    }
  }

  return {
    success: true,
    message: 'Refund processed',
    donationId: donation._id.toString(),
    processed: true
  }
}

// Handle refund processed event
async function handleRefundProcessed(event: WebhookEvent): Promise<WebhookProcessingResult> {
  // Similar to refund created, but indicates the refund has been completed
  return await handleRefundCreated(event)
}

// Health check endpoint for webhook
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  })
}