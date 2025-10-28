import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import { User, UserStatus } from '../../../../models/User'
import { z } from 'zod'
import crypto from 'crypto'

// Email verification request schema
const verifyRequestSchema = z.object({
  email: z.string().email('Invalid email format')
})

// Email verification confirmation schema
const verifyConfirmSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email format')
})

// Request email verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = verifyRequestSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.issues
        },
        { status: 400 }
      )
    }

    const { email } = validatedData.data

    await connectToDatabase()

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 3600000) // 24 hours from now

    // Store verification token
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry
    })

    // TODO: Send verification email
    // For now, we'll just log the token (in production, this should be sent via email)
    console.log(`Email verification token for ${email}: ${verificationToken}`)

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Confirm email verification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = verifyConfirmSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.issues
        },
        { status: 400 }
      )
    }

    const { token, email } = validatedData.data

    await connectToDatabase()

    // Find user with valid verification token
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user as verified and activate if they're a donor
    const updateData: any = {
      emailVerified: new Date(),
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined
    }

    // Auto-activate donors upon email verification
    if (user.role === 'DONOR' && user.status === UserStatus.PENDING) {
      updateData.status = UserStatus.ACTIVE
    }

    await User.findByIdAndUpdate(user._id, updateData)

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}