import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User, userRegistrationSchema, UserRole, UserStatus } from '@/models/User'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { withApiHandler, rateLimiters } from '@/lib/api-handler'

/**
 * New user signup endpoint with comprehensive validation
 * All new accounts are created as ACTIVE (no approval needed)
 * Rate limited to prevent abuse
 */
async function signupHandler(request: NextRequest) {
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
        // Generate a new unique referral code with additional randomness
        const { generateReferralCode } = await import('@/lib/generateReferral')
        let newCode = generateReferralCode(role || 'VOLUNTEER')
        let attempts = 0

        // Try up to 10 times to generate a unique code
        while (attempts < 10) {
          const codeExists = await User.findOne({ referralCode: newCode })
          if (!codeExists) {
            // Use the new unique code
            body.referralCode = newCode
            break
          }
          newCode = generateReferralCode(role || 'VOLUNTEER')
          attempts++
        }

        if (attempts >= 10) {
          return NextResponse.json(
            { error: 'Unable to generate unique referral code. Please try again.' },
            { status: 500 }
          )
        }
      }
    }

    // Validate parent coordinator if provided
    let parentCoordinatorId = null

    // Auto-assign ADMIN as parent for STATE_PRESIDENT and STATE_COORDINATOR
    if (role === UserRole.STATE_PRESIDENT || role === UserRole.STATE_COORDINATOR) {
      // Try to find a real admin user, or use demo-admin as fallback
      const adminUser = await User.findOne({ role: UserRole.ADMIN })
      if (adminUser) {
        parentCoordinatorId = adminUser._id
      } else {
        // Use demo-admin as parent if no real admin exists
        parentCoordinatorId = 'demo-admin' as any
      }
    } else if (parentId && parentId.trim() !== '') {
      // Only validate parent if it's provided and not empty string
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return NextResponse.json(
          { error: 'Invalid parent coordinator ID format' },
          { status: 400 }
        )
      }

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

    // Create new user with status = ACTIVE (all users are active immediately)
    const userData: any = {
      name,
      email: email.toLowerCase(),
      hashedPassword,
      phone,
      role: role || UserRole.VOLUNTEER,
      status: UserStatus.ACTIVE, // All users are ACTIVE by default
      parentCoordinatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Only add optional fields if they have values (not null/undefined)
    if (fatherName) userData.fatherName = fatherName
    if (address) userData.address = address
    if (district) userData.district = district
    if (state) userData.state = state
    if (region) userData.region = region
    if (referralCode) userData.referralCode = referralCode
    if (uniqueId) userData.uniqueId = uniqueId
    if (profilePhoto) userData.profilePhoto = profilePhoto
    if (fatherPhone) userData.fatherPhone = fatherPhone
    if (motherPhone) userData.motherPhone = motherPhone

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
        message: 'Signup successful! You can now login.',
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

// Apply rate limiting to signup endpoint
export const POST = withApiHandler(signupHandler, {
  rateLimit: rateLimiters.strict // 5 requests per 15 minutes
})

