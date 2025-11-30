import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole, UserStatus } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'
import { Donation, PaymentStatus } from '@/models/Donation'
import { ALL_COORDINATOR_ROLES, PARENT_COORDINATOR_ROLES, isCoordinatorRole } from '@/lib/role-utils'
import { isDemoAdminById } from '@/lib/demo-admin'
import mongoose from 'mongoose'
import { z } from 'zod'

const updateCoordinatorSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/).optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/).min(10).max(15).optional(),
  region: z.string().min(2).max(50).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING]).optional(),
  parentCoordinatorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
})

// GET /api/coordinators/[id] - Get specific coordinator with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { id } = await params

    // Handle demo-admin case
    if (isDemoAdminById(id)) {
      return NextResponse.json({ error: 'Demo admin cannot be accessed as coordinator' }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid coordinator ID' }, { status: 400 })
    }

    const coordinator = await User.findById(id)
      .populate('parentCoordinatorId', 'name email region')
      .select('-hashedPassword')

    if (!coordinator) {
      return NextResponse.json({ error: 'Coordinator not found' }, { status: 404 })
    }

    // Check if user is a coordinator role (any level except DONOR)
    if (!isCoordinatorRole(coordinator.role)) {
      return NextResponse.json({ error: 'User is not a coordinator' }, { status: 400 })
    }

    // Check permissions - user can access their own data or admin can access all
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canAccess =
      currentUser.role === UserRole.ADMIN ||
      coordinator._id.toString() === currentUser._id.toString()

    if (!canAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get additional details
    const [referralCodes, subCoordinators, performanceStats] = await Promise.all([
      ReferralCode.findByOwner(coordinator._id),

      User.find({
        parentCoordinatorId: coordinator._id,
        role: { $in: ALL_COORDINATOR_ROLES }
      }).select('-hashedPassword'),

      Donation.aggregate([
        {
          $match: {
            attributedToUserId: coordinator._id,
            paymentStatus: PaymentStatus.SUCCESS
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalDonations: { $sum: 1 },
            averageDonation: { $avg: '$amount' }
          }
        }
      ])
    ])

    // Get sub-coordinators with their referral codes
    const subCoordinatorsWithReferrals = await Promise.all(
      subCoordinators.map(async (subCoordinator) => {
        const referralCode = await ReferralCode.findActiveByOwner(subCoordinator._id)
        return {
          ...subCoordinator.toJSON(),
          referralCode: referralCode ? {
            id: referralCode._id,
            code: referralCode.code,
            totalDonations: referralCode.totalDonations,
            totalAmount: referralCode.totalAmount
          } : null
        }
      })
    )

    // Get recent donations
    const recentDonations = await Donation.find({
      attributedToUserId: coordinator._id,
      paymentStatus: PaymentStatus.SUCCESS
    })
      .populate('programId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('donorName amount createdAt programId')

    const performance = performanceStats[0] || {
      totalAmount: 0,
      totalDonations: 0,
      averageDonation: 0
    }

    return NextResponse.json({
      ...coordinator.toJSON(),
      referralCodes,
      subCoordinators: subCoordinatorsWithReferrals,
      performance,
      recentDonations
    })

  } catch (error: any) {
    console.error('Error fetching coordinator:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

// PATCH /api/coordinators/[id] - Update coordinator
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { id } = await params

    // Handle demo-admin case
    if (isDemoAdminById(id)) {
      return NextResponse.json({ error: 'Demo admin cannot be modified' }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid coordinator ID' }, { status: 400 })
    }

    const body = await request.json()
    const validation = updateCoordinatorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const coordinator = await User.findById(id)
    if (!coordinator) {
      return NextResponse.json({ error: 'Coordinator not found' }, { status: 404 })
    }

    // Check if user is a coordinator role
    if (!isCoordinatorRole(coordinator.role)) {
      return NextResponse.json({ error: 'User is not a coordinator' }, { status: 400 })
    }

    // Check permissions - only admin can modify
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canModify = currentUser.role === UserRole.ADMIN

    if (!canModify) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update fields
    const { name, phone, region, status, parentCoordinatorId } = validation.data

    if (name !== undefined) coordinator.name = name
    if (phone !== undefined) coordinator.phone = phone
    if (region !== undefined) coordinator.region = region
    if (status !== undefined) coordinator.status = status

    // Validate parent coordinator change
    if (parentCoordinatorId !== undefined) {
      if (parentCoordinatorId) {
        const parentCoordinator = await User.findById(parentCoordinatorId)
        if (!parentCoordinator || !PARENT_COORDINATOR_ROLES.includes(parentCoordinator.role as any)) {
          return NextResponse.json({ error: 'Invalid parent coordinator' }, { status: 400 })
        }
        coordinator.parentCoordinatorId = new mongoose.Types.ObjectId(parentCoordinatorId)
      } else {
        coordinator.parentCoordinatorId = undefined
      }
    }

    await coordinator.save()

    // Update referral code region if changed
    if (region !== undefined) {
      const referralCode = await ReferralCode.findActiveByOwner(coordinator._id)
      if (referralCode && referralCode.region !== region) {
        referralCode.region = region
        await referralCode.save()
      }
    }

    // Return updated coordinator
    await coordinator.populate('parentCoordinatorId', 'name email region')

    return NextResponse.json(coordinator.toJSON())

  } catch (error: any) {
    console.error('Error updating coordinator:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => ({
        field,
        message: error.errors[field].message
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update coordinator', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/coordinators/[id] - Deactivate coordinator (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { id } = await params

    // Handle demo-admin case
    if (isDemoAdminById(id)) {
      return NextResponse.json({ error: 'Demo admin cannot be deleted' }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid coordinator ID' }, { status: 400 })
    }

    const coordinator = await User.findById(id)
    if (!coordinator) {
      return NextResponse.json({ error: 'Coordinator not found' }, { status: 404 })
    }

    // Check if user is a coordinator role
    if (!isCoordinatorRole(coordinator.role)) {
      return NextResponse.json({ error: 'User is not a coordinator' }, { status: 400 })
    }

    // Check permissions - only admins can delete coordinators
    const currentUser = await User.findById(session.user.id)
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if coordinator has sub-coordinators
    const subCoordinatorCount = await User.countDocuments({
      parentCoordinatorId: coordinator._id,
      status: UserStatus.ACTIVE
    })

    if (subCoordinatorCount > 0) {
      return NextResponse.json({
        error: 'Cannot deactivate coordinator with active sub-coordinators'
      }, { status: 400 })
    }

    // Soft delete by deactivating
    coordinator.status = UserStatus.INACTIVE
    await coordinator.save()

    // Deactivate referral codes
    const referralCodes = await ReferralCode.findByOwner(coordinator._id)
    await Promise.all(referralCodes.map(code => code.deactivate()))

    return NextResponse.json({ message: 'Coordinator deactivated successfully' })

  } catch (error: any) {
    console.error('Error deleting coordinator:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate coordinator', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}