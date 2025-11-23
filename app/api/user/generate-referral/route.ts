import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { generateReferralCode } from '@/lib/referral-utils'

/**
 * POST /api/user/generate-referral
 * Generate a new referral code for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get current user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a referral code
    if (user.referralCode) {
      return NextResponse.json({
        success: true,
        referralCode: user.referralCode,
        message: 'Referral code already exists'
      })
    }

    // Generate new referral code
    const referralCode = await generateReferralCode(
      user.name,
      user.role,
      user.state || user.district || undefined
    )

    // Update user with referral code
    user.referralCode = referralCode
    await user.save()

    // Create ReferralCode document
    const { ReferralCode, ReferralCodeType } = await import('@/models/ReferralCode')
    const parentCode = user.parentCoordinatorId ? await User.findById(user.parentCoordinatorId).select('referralCode') : null
    const parentCodeDoc = parentCode?.referralCode ? await ReferralCode.findOne({ code: parentCode.referralCode }) : null

    await ReferralCode.create({
      code: referralCode,
      ownerUserId: user._id,
      parentCodeId: parentCodeDoc?._id,
      type: user.role === 'VOLUNTEER' ? ReferralCodeType.SUB_COORDINATOR : ReferralCodeType.COORDINATOR,
      region: user.state || user.district || 'General',
      active: true
    })

    return NextResponse.json({
      success: true,
      referralCode,
      message: 'Referral code generated successfully'
    })

  } catch (error: any) {
    console.error('Error generating referral code:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
