import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { RazorpayService } from '@/lib/razorpay'
import { Program } from '@/models/Program'
import { ReferralCode, referralCodeUtils } from '@/models/ReferralCode'

// Request validation schema
const createOrderSchema = z.object({
  amount: z.number().min(21, 'Minimum amount is ₹21').max(1000000, 'Maximum amount is ₹10,00,000'),
  programId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  referralCode: z.string().optional(),
  referredBy: z.string().optional(),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  donorPhone: z.string().optional(),
})

/**
 * POST /api/donations/create-order
 * Create Razorpay order for donation
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request
    const validationResult = createOrderSchema.safeParse(body)
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

    const { amount, programId, referralCode, referredBy, donorName, donorEmail, donorPhone } = validationResult.data

    // Validate program if provided (REQUIRED NOW)
    let program = null
    if (programId) {
      program = await Program.findById(programId)
      if (!program || !program.active) {
        return NextResponse.json(
          { success: false, error: 'Invalid or inactive program selected' },
          { status: 400 }
        )
      }
    } else {
      // Program is now required
      return NextResponse.json(
        { success: false, error: 'Please select a program for your donation' },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    let referralData = null
    if (referralCode) {
      // First try to find in ReferralCode collection
      referralData = await referralCodeUtils.resolveReferralCode(referralCode)

      // If not found, try User.referralCode as fallback
      if (!referralData) {
        const { User } = await import('@/models/User')
        const userWithCode = await User.findOne({
          referralCode: referralCode.toUpperCase(),
          status: 'ACTIVE'
        })

        if (userWithCode) {
          // Valid referral code found in User collection
          referralData = { code: referralCode, active: true, ownerUserId: userWithCode._id }
        }
      }

      if (!referralData || !referralData.active) {
        return NextResponse.json(
          { success: false, error: 'Invalid or inactive referral code' },
          { status: 400 }
        )
      }
    }

    // Create Razorpay order
    const razorpayOrder = await RazorpayService.createOrder({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        programId: programId || '',
        programName: program?.name || '',
        referralCode: referralCode || '',
        referredBy: referredBy || '',
        donorName: donorName || '',
        donorEmail: donorEmail || '',
        donorPhone: donorPhone || '',
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    })

  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
