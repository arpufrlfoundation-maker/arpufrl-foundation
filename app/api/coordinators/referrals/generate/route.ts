import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'
import { generateReferralCode as generateCode } from '@/lib/referral-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get user details
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate unique referral code
    const code = await generateCode(
      user.name,
      user.role,
      user.region || 'general'
    )

    // Check if user already has a referral code
    const existingCode = await ReferralCode.findOne({ ownerUserId: user._id })
    if (existingCode) {
      return NextResponse.json({
        code: {
          id: existingCode._id.toString(),
          code: existingCode.code,
          type: existingCode.type,
          active: existingCode.active,
          totalDonations: existingCode.totalDonations || 0,
          totalAmount: existingCode.totalAmount || 0,
          createdAt: existingCode.createdAt
        }
      })
    }

    // Create new referral code
    // Determine referral code type based on user role
    const coordinatorRoles = [
      UserRole.CENTRAL_PRESIDENT,
      UserRole.STATE_PRESIDENT,
      UserRole.STATE_COORDINATOR,
      UserRole.ZONE_COORDINATOR,
      UserRole.DISTRICT_PRESIDENT,
      UserRole.DISTRICT_COORDINATOR
    ] as const

    const isCoordinator = coordinatorRoles.includes(user.role as any)

    const referralCode = new ReferralCode({
      code,
      ownerUserId: user._id,
      type: isCoordinator ? 'COORDINATOR' : 'SUB_COORDINATOR',
      region: user.region,
      active: true,
      parentCodeId: user.parentCoordinatorId
        ? (await ReferralCode.findOne({ ownerUserId: user.parentCoordinatorId }))?._id
        : undefined
    })

    await referralCode.save()

    // Update user with referral code
    user.referralCode = code
    await user.save()

    return NextResponse.json({
      success: true,
      code: {
        id: referralCode._id.toString(),
        code: referralCode.code,
        type: referralCode.type,
        active: referralCode.active,
        totalDonations: 0,
        totalAmount: 0,
        createdAt: referralCode.createdAt
      }
    })
  } catch (error) {
    console.error('Generate referral code error:', error)
    return NextResponse.json(
      { error: 'Failed to generate referral code' },
      { status: 500 }
    )
  }
}
