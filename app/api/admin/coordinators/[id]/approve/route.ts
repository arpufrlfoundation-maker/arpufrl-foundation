import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../lib/auth'
import { connectToDatabase } from '../../../../../../lib/db'
import { User, UserRole, UserStatus } from '../../../../../../models/User'
import { ReferralCode } from '../../../../../../models/ReferralCode'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { id } = await params

    // Validate the coordinator ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid coordinator ID' },
        { status: 400 }
      )
    }

    // Find the coordinator
    const coordinator = await User.findById(id)
    if (!coordinator) {
      return NextResponse.json(
        { error: 'Coordinator not found' },
        { status: 404 }
      )
    }

    // Check if user is a coordinator
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

    if (!coordinatorRoles.includes(coordinator.role as any)) {
      return NextResponse.json(
        { error: 'User is not a coordinator' },
        { status: 400 }
      )
    }

    // Check if coordinator is pending
    if (coordinator.status !== UserStatus.PENDING) {
      return NextResponse.json(
        { error: 'Coordinator is not pending approval' },
        { status: 400 }
      )
    }

    // Update coordinator status to active
    coordinator.status = UserStatus.ACTIVE
    await coordinator.save()

    // Generate referral code if not exists
    let referralCode = await ReferralCode.findOne({ ownerUserId: coordinator._id })

    if (!referralCode) {
      // Generate unique referral code
      const baseCode = `${coordinator.name.toLowerCase().replace(/\s+/g, '-')}-${coordinator.region?.toLowerCase().replace(/\s+/g, '-') || 'general'}`
      let uniqueCode = baseCode
      let counter = 1

      // Ensure uniqueness
      while (await ReferralCode.findOne({ code: uniqueCode })) {
        uniqueCode = `${baseCode}-${counter}`
        counter++
      }

      // Create referral code
      referralCode = new ReferralCode({
        code: uniqueCode,
        ownerUserId: coordinator._id,
        type: coordinator.role, // Use the actual role
        region: coordinator.region,
        active: true,
        parentCodeId: coordinator.parentCoordinatorId ?
          (await ReferralCode.findOne({ ownerUserId: coordinator.parentCoordinatorId }))?._id :
          undefined
      })

      await referralCode.save()
    }

    return NextResponse.json({
      message: 'Coordinator approved successfully',
      coordinator: {
        id: coordinator._id.toString(),
        name: coordinator.name,
        email: coordinator.email,
        status: coordinator.status,
        referralCode: referralCode.code
      }
    })

  } catch (error) {
    console.error('Approve coordinator error:', error)
    return NextResponse.json(
      { error: 'Failed to approve coordinator' },
      { status: 500 }
    )
  }
}