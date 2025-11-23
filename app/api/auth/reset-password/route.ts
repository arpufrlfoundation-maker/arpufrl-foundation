import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import { User } from '../../../../models/User'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { withApiHandler, rateLimiters } from '@/lib/api-handler'

// Password reset request schema
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
})

// Password reset confirmation schema
const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Request password reset
async function requestResetHandler(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = resetRequestSchema.safeParse(body)
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
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in user document (you might want to create a separate collection for this)
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry
    })

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, this should be sent via email)

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply rate limiting - strict for password reset
export const POST = withApiHandler(requestResetHandler, {
  rateLimit: rateLimiters.strict // 5 requests per 15 minutes
})

// Confirm password reset
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = resetConfirmSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.issues
        },
        { status: 400 }
      )
    }

    const { token, password } = validatedData.data

    await connectToDatabase()

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+hashedPassword')

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    })

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}