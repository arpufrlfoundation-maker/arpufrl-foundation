// Authentication API routes for user registration and management
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../lib/db'
import { User, userRegistrationSchema, UserRole, UserStatus } from '../../../models/User'
import { z } from 'zod'
import mongoose from 'mongoose'

// User registration endpoint
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

    const { name, email, phone, password, role, region, parentCoordinatorId } = validatedData.data

    // Connect to database
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Validate parent coordinator if provided
    if (parentCoordinatorId) {
      const parentCoordinator = await User.findById(parentCoordinatorId)
      if (!parentCoordinator || (parentCoordinator.role !== UserRole.ADMIN && parentCoordinator.role !== UserRole.COORDINATOR)) {
        return NextResponse.json(
          { error: 'Invalid parent coordinator' },
          { status: 400 }
        )
      }
    }

    // Create new user
    const userData = {
      name,
      email,
      phone,
      role: role || UserRole.DONOR,
      status: role === UserRole.DONOR ? UserStatus.ACTIVE : UserStatus.PENDING,
      region,
      parentCoordinatorId: parentCoordinatorId ? new mongoose.Types.ObjectId(parentCoordinatorId) : undefined
    }

    const user = await User.createUser(userData, password)

    // Return user data without sensitive information
    const { hashedPassword, ...userResponse } = user.toJSON()

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user profile endpoint (for authenticated users)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data without sensitive information
    const { hashedPassword, ...userResponse } = user.toJSON()

    return NextResponse.json({ user: userResponse })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}