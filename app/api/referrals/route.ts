import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { ReferralCode, referralCodeUtils } from '@/models/ReferralCode'
import { User, UserRole } from '@/models/User'
import mongoose from 'mongoose'
import { z } from 'zod'

// Validation schemas
const createReferralCodeSchema = z.object({
  ownerUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  parentCodeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent code ID format').optional(),
  region: z.string().min(2).max(50).optional()
})

const updateReferralCodeSchema = z.object({
  active: z.boolean().optional(),
  region: z.string().min(2).max(50).optional()
})

// GET /api/referrals - Get referral codes with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const ownerUserId = searchParams.get('ownerUserId')
    const type = searchParams.get('type')
    const region = searchParams.get('region')
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query: any = {}

    // Role-based access control
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === UserRole.ADMIN) {
      // Admins can see all referral codes
      if (ownerUserId) query.ownerUserId = ownerUserId
    } else if (user.role === UserRole.COORDINATOR) {
      // Coordinators can see their own codes and their sub-coordinators' codes
      const subCoordinatorIds = await User.find({
        parentCoordinatorId: user._id,
        role: UserRole.SUB_COORDINATOR
      }).distinct('_id')

      query.$or = [
        { ownerUserId: user._id },
        { ownerUserId: { $in: subCoordinatorIds } }
      ]
    } else if (user.role === UserRole.SUB_COORDINATOR) {
      // Sub-coordinators can only see their own codes
      query.ownerUserId = user._id
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Apply filters
    if (type) query.type = type
    if (region) query.region = new RegExp(region, 'i')
    if (active !== null) query.active = active === 'true'

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [referralCodes, total] = await Promise.all([
      ReferralCode.find(query)
        .populate('ownerUserId', 'name email role region')
        .populate('parentCodeId', 'code ownerUserId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReferralCode.countDocuments(query)
    ])

    return NextResponse.json({
      referralCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching referral codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/referrals - Create new referral code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const body = await request.json()
    const validation = createReferralCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { ownerUserId, parentCodeId, region } = validation.data

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = await User.findById(ownerUserId)
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Permission checks
    if (currentUser.role === UserRole.ADMIN) {
      // Admins can create codes for anyone
    } else if (currentUser.role === UserRole.COORDINATOR) {
      // Coordinators can create codes for their sub-coordinators
      if (targetUser.role !== UserRole.SUB_COORDINATOR ||
        targetUser.parentCoordinatorId?.toString() !== currentUser._id.toString()) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate parent code if provided
    if (parentCodeId) {
      const parentCode = await ReferralCode.findById(parentCodeId).populate('ownerUserId')
      if (!parentCode) {
        return NextResponse.json({ error: 'Parent referral code not found' }, { status: 404 })
      }

      const parentOwner = parentCode.ownerUserId as any
      if (parentOwner.role !== UserRole.ADMIN && parentOwner.role !== UserRole.COORDINATOR) {
        return NextResponse.json({ error: 'Parent code must belong to admin or coordinator' }, { status: 400 })
      }
    }

    // Create referral code
    const referralCode = await ReferralCode.createForUser(
      targetUser._id,
      parentCodeId ? new mongoose.Types.ObjectId(parentCodeId) : undefined
    )

    // Update region if provided
    if (region && region !== referralCode.region) {
      referralCode.region = region
      await referralCode.save()
    }

    // Populate the response
    await referralCode.populate('ownerUserId', 'name email role region')
    if (referralCode.parentCodeId) {
      await referralCode.populate('parentCodeId', 'code ownerUserId')
    }

    return NextResponse.json(referralCode, { status: 201 })

  } catch (error) {
    console.error('Error creating referral code:', error)

    if (error instanceof Error) {
      if (error.message.includes('already has an active referral code')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('Unable to generate unique referral code')) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}