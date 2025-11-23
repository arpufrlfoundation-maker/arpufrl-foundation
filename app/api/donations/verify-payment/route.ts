import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { RazorpayService } from '@/lib/razorpay'
import { Donation } from '@/models/Donation'
import { Program } from '@/models/Program'
import { ReferralCode, referralCodeUtils } from '@/models/ReferralCode'
import { User } from '@/models/User'
import { sendDonationConfirmationEmail, sendDonationNotificationToAdmin, sendReferralNotificationToCoordinator } from '@/lib/email'
import { processCommissionDistribution } from '@/lib/commission-utils'

/**
 * Extract IP address from request headers
 * Handles proxy headers for Vercel and other platforms
 */
function getClientIp(request: NextRequest): string | undefined {
  // Check various headers in order of priority
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0]
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  if (cfConnectingIp) return cfConnectingIp

  // Fallback for local development
  return '127.0.0.1'
}

// Request validation schema
const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

/**
 * POST /api/donations/verify-payment
 * Verify Razorpay payment and create donation record
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request
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

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = validationResult.data

    // Verify payment signature
    const isValid = RazorpayService.verifyPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Fetch order details from Razorpay
    const orderDetails = await RazorpayService.fetchOrder(razorpayOrderId)
    const paymentDetails = await RazorpayService.fetchPayment(razorpayPaymentId)

    if (!orderDetails || !paymentDetails) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment details' },
        { status: 500 }
      )
    }

    // Extract metadata from order notes
    const notes = orderDetails.notes || {}
    const amount = orderDetails.amount / 100 // Convert from paise to rupees

    // Resolve program
    let program = null
    if (notes.programId) {
      program = await Program.findById(notes.programId)
    }

    // Resolve referral code
    let referralData = null
    let attributedUser = null
    if (notes.referralCode) {
      referralData = await referralCodeUtils.resolveReferralCode(notes.referralCode)
      if (referralData) {
        attributedUser = await User.findById(referralData.ownerUserId)
      }
    }

    // Auto-detect IP address and user agent
    const clientIp = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    // Create donation record
    const donation = await Donation.create({
      donorName: notes.donorName || 'Anonymous Donor',
      donorEmail: notes.donorEmail || undefined,
      donorPhone: notes.donorPhone || undefined,
      amount,
      currency: orderDetails.currency,
      programId: program?._id,
      referralCodeId: referralData?._id,
      referredBy: attributedUser?._id,
      paymentStatus: 'SUCCESS',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: paymentDetails.method,
      transactionId: razorpayPaymentId,
      isAnonymous: !notes.donorName || notes.donorName === 'Anonymous Donor',
      privacyConsentGiven: true,
      dataProcessingConsent: true,
      ipAddress: clientIp,
      userAgent: userAgent,
    })

    // Update program donation stats
    if (program) {
      program.donationCount = (program.donationCount || 0) + 1
      program.raisedAmount = (program.raisedAmount || 0) + amount
      await program.save()
    }

    // Update user donation stats
    if (attributedUser) {
      attributedUser.totalDonationsReferred = (attributedUser.totalDonationsReferred || 0) + 1
      attributedUser.totalAmountReferred = (attributedUser.totalAmountReferred || 0) + amount
      await attributedUser.save()

      // Update target collections for the user and propagate up hierarchy
      try {
        const Target = (await import('@/models/Target')).default
        const donationDate = new Date()

        const activeTarget = await Target.findOne({
          assignedTo: attributedUser._id,
          status: { $in: ['PENDING', 'IN_PROGRESS'] },
          startDate: { $lte: donationDate },
          endDate: { $gte: donationDate }
        })

        if (activeTarget) {
          activeTarget.personalCollection = (activeTarget.personalCollection || 0) + amount
          activeTarget.totalCollection = (activeTarget.totalCollection || 0) + amount
          activeTarget.progressPercentage = (activeTarget.totalCollection / activeTarget.targetAmount) * 100

          // Update status based on progress
          if (activeTarget.status === 'PENDING') {
            activeTarget.status = 'IN_PROGRESS'
          }
          if (activeTarget.progressPercentage >= 100) {
            activeTarget.status = 'COMPLETED'
          }

          await activeTarget.save()
          console.log(`Updated target for user ${attributedUser._id}: +${amount} to personal collection (Target period: ${activeTarget.startDate} to ${activeTarget.endDate})`)

          // Propagate to parent coordinators
          let currentParentId = attributedUser.parentCoordinatorId
          const visited = new Set<string>()

          while (currentParentId && !visited.has(currentParentId.toString())) {
            visited.add(currentParentId.toString())

            const parentTarget = await Target.findOne({
              assignedTo: currentParentId,
              status: { $in: ['PENDING', 'IN_PROGRESS'] },
              startDate: { $lte: donationDate },
              endDate: { $gte: donationDate }
            })

            if (parentTarget) {
              parentTarget.teamCollection = (parentTarget.teamCollection || 0) + amount
              parentTarget.totalCollection = parentTarget.personalCollection + parentTarget.teamCollection
              parentTarget.progressPercentage = (parentTarget.totalCollection / parentTarget.targetAmount) * 100

              if (parentTarget.status === 'PENDING') {
                parentTarget.status = 'IN_PROGRESS'
              }
              if (parentTarget.progressPercentage >= 100 && parentTarget.status !== 'COMPLETED') {
                parentTarget.status = 'COMPLETED'
              }

              await parentTarget.save()
              console.log(`Updated parent target ${currentParentId}: +${amount} to team collection (Target period: ${parentTarget.startDate} to ${parentTarget.endDate})`)
            } else {
              console.log(`No active target in date range for parent ${currentParentId}`)
            }

            // Get next parent
            const parentUser = await User.findById(currentParentId).select('parentCoordinatorId')
            currentParentId = parentUser?.parentCoordinatorId

            // Safety: max 20 levels
            if (visited.size >= 20) break
          }
        } else {
          console.log(`No active target in date range for user ${attributedUser._id} (Donation date: ${donationDate})`)
        }
      } catch (targetError) {
        console.error('Failed to update target collections:', targetError)
        // Don't fail the donation if target update fails
      }
    }

    // Send confirmation email to donor (if email provided)
    if (donation.donorEmail) {
      try {
        await sendDonationConfirmationEmail(
          donation.donorEmail,
          donation.donorName,
          amount,
          program?.name || 'General Donation',
          donation._id.toString(),
          razorpayPaymentId,
          notes.referralCode || undefined,
          attributedUser?.name || undefined
        )
        console.log(`Donation confirmation email sent to ${donation.donorEmail}`)
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Send notification to admin
    try {
      await sendDonationNotificationToAdmin(
        donation.donorName,
        amount,
        program?.name || 'General Donation',
        donation._id.toString()
      )
      console.log('Donation notification sent to admin')
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
      // Don't fail the request if email fails
    }

    // Send notification to coordinator if referral code was used
    if (attributedUser && attributedUser.email && notes.referralCode) {
      try {
        await sendReferralNotificationToCoordinator(
          attributedUser.email,
          attributedUser.name,
          donation.donorName,
          amount,
          program?.name || 'General Donation',
          notes.referralCode
        )
        console.log(`Referral notification sent to coordinator ${attributedUser.email}`)
      } catch (emailError) {
        console.error('Failed to send coordinator notification:', emailError)
        // Don't fail the request if email fails
      }

      // Process commission distribution for referral donation
      try {
        const commissionResult = await processCommissionDistribution(
          donation._id,
          attributedUser._id,
          amount
        )
        console.log('Commission distribution processed:', {
          donationId: donation._id,
          totalCommission: commissionResult.totalCommission,
          distributions: commissionResult.distributions.length,
          organizationFund: commissionResult.organizationFund
        })
      } catch (commissionError) {
        console.error('Failed to process commission distribution:', commissionError)
        // Don't fail the donation if commission processing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      donation: {
        id: donation._id,
        amount: donation.amount,
        programName: program?.name,
        razorpayPaymentId
      }
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
