import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User, userRegistrationSchema, UserRole, UserStatus } from '@/models/User'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

/**
 * New user signup endpoint with comprehensive validation
 * All new accounts default to status = PENDING
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input data
    const validatedData = userRegistrationSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.issues
        },
        { status: 400 }
      )
    }

    const {
      name,
      fatherName,
      address,
      district,
      state,
      email,
      phone,
      password,
      confirmPassword,
      role,
      region,
      parentId,
      referralCode,
      uniqueId,
      profilePhoto,
      fatherPhone,
      motherPhone
    } = body

    // Connect to database
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check if referral code already exists (if provided)
    if (referralCode) {
      const existingReferralCode = await User.findOne({ referralCode })
      if (existingReferralCode) {
        return NextResponse.json(
          { error: 'Referral code already exists. Please refresh the page to generate a new one.' },
          { status: 409 }
        )
      }
    }

    // Validate parent coordinator if provided
    let parentCoordinatorId = null
    if (parentId) {
      const parentCoordinator = await User.findById(parentId)
      if (!parentCoordinator) {
        return NextResponse.json(
          { error: 'Invalid parent coordinator' },
          { status: 400 }
        )
      }
      parentCoordinatorId = new mongoose.Types.ObjectId(parentId)
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user with status = PENDING (default for all new signups)
    const userData = {
      name,
      fatherName: fatherName || null,
      address: address || null,
      district: district || null,
      state: state || null,
      email: email.toLowerCase(),
      hashedPassword,
      phone,
      role: role || UserRole.VOLUNTEER,
      status: role === UserRole.VOLUNTEER ? UserStatus.ACTIVE : UserStatus.PENDING, // Volunteers are active, others pending
      region,
      referralCode: referralCode || null,
      uniqueId: uniqueId || null,
      profilePhoto: profilePhoto || null,
      parentCoordinatorId,
      fatherPhone: fatherPhone || null,
      motherPhone: motherPhone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const user = new User(userData)
    await user.save()

    // Return success response without sensitive information
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      region: user.region,
      referralCode: user.referralCode,
      parentCoordinatorId: user.parentCoordinatorId?.toString(),
      createdAt: user.createdAt,
    }

    return NextResponse.json(
      {
        message: 'Signup successful! Please wait for approval from your superior.',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error during signup' },
      { status: 500 }
    )
  }
}
