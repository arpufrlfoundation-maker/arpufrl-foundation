import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { RazorpayService, CreateOrderInput } from '@/lib/razorpay'
import { Donation, donationCreationSchema } from '@/models/Donation'
import { ReferralCode, referralCodeUtils } from '@/models/ReferralCode'
import { Program } from '@/models/Program'

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

// Request validation schemas
const createDonationSchema = z.object({
  donorName: z.string().min(2).max(100),
  donorEmail: z.string().email().optional(),
  donorPhone: z.string().min(10).max(15).optional(),
  amount: z.number().min(100).max(10000000), // Amount in paise (₹1 to ₹100,000)
  programId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Please select a program'), // Made required
  referralCode: z.string().min(3).max(50).optional(),
})

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

// GET /api/donations - Fetch donations (with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const programId = searchParams.get('programId')
    const referralCode = searchParams.get('referralCode')
    const email = searchParams.get('email')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter query
    const filter: any = {}

    if (status) {
      filter.paymentStatus = status
    }

    if (programId) {
      filter.programId = programId
    }

    if (email) {
      filter.donorEmail = email
    }

    if (referralCode) {
      const referral = await referralCodeUtils.resolveReferralCode(referralCode)
      if (referral) {
        filter.referralCodeId = referral._id
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch donations with population
    const [donations, totalCount] = await Promise.all([
      Donation.find(filter)
        .populate('programId', 'name slug')
        .populate('referralCodeId', 'code')
        .populate('attributedToUserId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(filter)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        donations,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch donations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/donations - Create new donation order
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = createDonationSchema.safeParse(body)
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

    const { donorName, donorEmail, donorPhone, amount, programId, referralCode } = validationResult.data

    // Validate program (REQUIRED)
    const program = await Program.findById(programId)
    if (!program || !program.active) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid program for your donation' },
        { status: 400 }
      )
    }

    // Validate and resolve referral code if provided
    let referralCodeDoc = null
    if (referralCode) {
      referralCodeDoc = await referralCodeUtils.resolveReferralCode(referralCode)
      if (!referralCodeDoc) {
        return NextResponse.json(
          { success: false, error: 'Invalid referral code' },
          { status: 400 }
        )
      }
    }

    // Auto-detect client IP and user agent for tracking
    const clientIP = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    // Create Razorpay order
    const orderInput: CreateOrderInput = {
      amount: amount, // Amount is already in paise
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      notes: {
        donorName,
        ...(donorEmail && { donorEmail }),
        ...(programId && { programId }),
        ...(referralCode && { referralCode })
      }
    }

    const razorpayOrder = await RazorpayService.createOrder(orderInput)

    // Create donation record in database
    const donation = new Donation({
      donorName,
      donorEmail,
      donorPhone,
      amount,
      currency: 'INR',
      programId,
      paymentStatus: 'PENDING',
      razorpayOrderId: razorpayOrder.id,
      referralCodeId: referralCodeDoc?._id,
      attributedToUserId: referralCodeDoc?.ownerUserId,
      ipAddress: clientIP,
      userAgent: userAgent ? userAgent.substring(0, 500) : undefined,
      privacyConsentGiven: true,
      dataProcessingConsent: true
    })

    await donation.save()

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        donationId: donation._id,
        programName: program?.name,
        referralCode: referralCodeDoc?.code,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      }
    })

  } catch (error) {
    console.error('Error creating donation order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create donation order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}