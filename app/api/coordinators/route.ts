import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole, UserStatus, userUtils } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'
import mongoose from 'mongoose'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schemas
const createCoordinatorSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/).min(10).max(15).optional(),
  region: z.string().min(2).max(50),
  role: z.enum([UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]),
  parentCoordinatorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

const updateCoordinatorSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/).optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/).min(10).max(15).optional(),
  region: z.string().min(2).max(50).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING]).optional(),
  parentCoordinatorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
})

// GET /api/coordinators - Get coordinators with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const region = searchParams.get('region')
    const parentCoordinatorId = searchParams.get('parentCoordinatorId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query based on user role
    const query: any = {
      role: { $in: [UserRole.COORDINATOR, UserRole.SUB_COORDINATOR] }
    }

    if (currentUser.role === UserRole.ADMIN) {
      // Admins can see all coordinators
    } else if (currentUser.role === UserRole.COORDINATOR) {
      // Coordinators can see themselves and their sub-coordinators
      query.$or = [
        { _id: currentUser._id },
        { parentCoordinatorId: currentUser._id }
      ]
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Apply filters
    if (role && [UserRole.COORDINATOR, UserRole.SUB_COORDINATOR].includes(role as any)) {
      query.role = role
    }
    if (status) query.status = status
    if (region) query.region = new RegExp(region, 'i')
    if (parentCoordinatorId) query.parentCoordinatorId = parentCoordinatorId

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [coordinators, total] = await Promise.all([
      User.find(query)
        .populate('parentCoordinatorId', 'name email region')
        .select('-hashedPassword')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ])

    // Get referral codes for each coordinator
    const coordinatorsWithReferrals = await Promise.all(
      coordinators.map(async (coordinator) => {
        const referralCode = await ReferralCode.findActiveByOwner(coordinator._id)
        return {
          ...coordinator.toJSON(),
          referralCode: referralCode ? {
            id: referralCode._id,
            code: referralCode.code,
            totalDonations: referralCode.totalDonations,
            totalAmount: referralCode.totalAmount
          } : null
        }
      })
    )

    return NextResponse.json({
      coordinators: coordinatorsWithReferrals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching coordinators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/coordinators - Create new coordinator
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const body = await request.json()
    const validation = createCoordinatorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, email, phone, region, role, parentCoordinatorId, password } = validation.data

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.role === UserRole.ADMIN) {
      // Admins can create any coordinator
    } else if (currentUser.role === UserRole.COORDINATOR && role === UserRole.SUB_COORDINATOR) {
      // Coordinators can create sub-coordinators under themselves
      if (!parentCoordinatorId || parentCoordinatorId !== currentUser._id.toString()) {
        return NextResponse.json({ error: 'Sub-coordinators must be created under your coordination' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Validate parent coordinator if provided
    if (parentCoordinatorId) {
      const parentCoordinator = await User.findById(parentCoordinatorId)
      if (!parentCoordinator ||
        (parentCoordinator.role !== UserRole.ADMIN && parentCoordinator.role !== UserRole.COORDINATOR)) {
        return NextResponse.json({ error: 'Invalid parent coordinator' }, { status: 400 })
      }
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12)
    const coordinator = new User({
      name,
      email,
      phone,
      region,
      role,
      parentCoordinatorId: parentCoordinatorId || undefined,
      hashedPassword,
      status: UserStatus.ACTIVE // Auto-approve coordinator accounts
    })

    await coordinator.save()

    // Create referral code for the coordinator
    try {
      const referralCode = await ReferralCode.createForUser(
        coordinator._id,
        parentCoordinatorId ? new mongoose.Types.ObjectId(parentCoordinatorId) : undefined
      )

      // Populate response
      await coordinator.populate('parentCoordinatorId', 'name email region')

      return NextResponse.json({
        ...coordinator.toJSON(),
        referralCode: {
          id: referralCode._id,
          code: referralCode.code,
          totalDonations: referralCode.totalDonations,
          totalAmount: referralCode.totalAmount
        }
      }, { status: 201 })

    } catch (referralError) {
      // If referral code creation fails, still return the coordinator
      console.error('Error creating referral code:', referralError)

      await coordinator.populate('parentCoordinatorId', 'name email region')

      return NextResponse.json({
        ...coordinator.toJSON(),
        referralCode: null,
        warning: 'Coordinator created but referral code generation failed'
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error creating coordinator:', error)

    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}