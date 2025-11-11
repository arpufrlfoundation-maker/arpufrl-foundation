import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { ReferralCode } from '@/models/ReferralCode'
import { User, UserRole } from '@/models/User'
import { Donation } from '@/models/Donation'
import mongoose from 'mongoose'
import { z } from 'zod'

// Define coordinator roles array
const coordinatorRoles = [
  UserRole.CENTRAL_PRESIDENT,
  UserRole.STATE_PRESIDENT,
  UserRole.STATE_COORDINATOR,
  UserRole.ZONE_COORDINATOR,
  UserRole.DISTRICT_PRESIDENT,
  UserRole.DISTRICT_COORDINATOR,
  UserRole.BLOCK_COORDINATOR,
  UserRole.NODAL_OFFICER,
  UserRole.PRERAK,
  UserRole.PRERNA_SAKHI
]

const updateReferralCodeSchema = z.object({
  active: z.boolean().optional(),
  region: z.string().min(2).max(50).optional()
})

// GET /api/referrals/[id] - Get specific referral code with details
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid referral code ID' }, { status: 400 })
    }

    const referralCode = await ReferralCode.findById(id)
      .populate('ownerUserId', 'name email role region')
      .populate('parentCodeId', 'code ownerUserId')

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canAccess =
      currentUser.role === UserRole.ADMIN ||
      referralCode.ownerUserId._id.toString() === currentUser._id.toString() ||
      (coordinatorRoles.includes(currentUser.role as any) &&
        (referralCode.ownerUserId as any).parentCoordinatorId?.toString() === currentUser._id.toString())

    if (!canAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get additional details
    const [subCodes, donations, hierarchy] = await Promise.all([
      referralCode.getSubCodes(),
      Donation.find({
        referralCodeId: referralCode._id,
        paymentStatus: 'SUCCESS'
      }).sort({ createdAt: -1 }).limit(10),
      referralCode.getHierarchy()
    ])

    return NextResponse.json({
      ...referralCode.toJSON(),
      subCodes,
      recentDonations: donations,
      hierarchy
    })

  } catch (error) {
    console.error('Error fetching referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/referrals/[id] - Update referral code
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid referral code ID' }, { status: 400 })
    }

    const body = await request.json()
    const validation = updateReferralCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const referralCode = await ReferralCode.findById(id).populate('ownerUserId')
    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canModify =
      currentUser.role === UserRole.ADMIN ||
      referralCode.ownerUserId._id.toString() === currentUser._id.toString() ||
      (coordinatorRoles.includes(currentUser.role as any) &&
        (referralCode.ownerUserId as any).parentCoordinatorId?.toString() === currentUser._id.toString())

    if (!canModify) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update fields
    const { active, region } = validation.data

    if (active !== undefined) {
      if (active) {
        await referralCode.activate()
      } else {
        await referralCode.deactivate()
      }
    }

    if (region !== undefined) {
      referralCode.region = region
      await referralCode.save()
    }

    // Return updated referral code
    await referralCode.populate('ownerUserId', 'name email role region')
    if (referralCode.parentCodeId) {
      await referralCode.populate('parentCodeId', 'code ownerUserId')
    }

    return NextResponse.json(referralCode)

  } catch (error) {
    console.error('Error updating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/referrals/[id] - Deactivate referral code (soft delete)
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid referral code ID' }, { status: 400 })
    }

    const referralCode = await ReferralCode.findById(id).populate('ownerUserId')
    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    // Check permissions - only admins and coordinators can delete
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canDelete =
      currentUser.role === UserRole.ADMIN ||
      (coordinatorRoles.includes(currentUser.role as any) &&
        (referralCode.ownerUserId as any).parentCoordinatorId?.toString() === currentUser._id.toString())

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Soft delete by deactivating
    await referralCode.deactivate()

    return NextResponse.json({ message: 'Referral code deactivated successfully' })

  } catch (error) {
    console.error('Error deleting referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}