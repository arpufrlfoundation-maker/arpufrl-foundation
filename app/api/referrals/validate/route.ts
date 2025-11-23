import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { ReferralCode, referralCodeUtils } from '@/models/ReferralCode'
import { z } from 'zod'

const validateReferralSchema = z.object({
  code: z.string().min(3).max(50)
})

// POST /api/referrals/validate - Validate referral code
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const validation = validateReferralSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { code } = validation.data

    // Resolve referral code
    const referralCode = await referralCodeUtils.resolveReferralCode(code)

    if (!referralCode || !referralCode.active) {
      return NextResponse.json({
        valid: false,
        message: 'Referral code not found or inactive'
      })
    }

    // Populate owner information if not already populated
    if (!referralCode.ownerUserId || typeof referralCode.ownerUserId === 'string') {
      await referralCode.populate('ownerUserId', 'name region role')
    }

    const owner = referralCode.ownerUserId as any

    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      codeType: referralCode.type,
      region: referralCode.region,
      ownerName: owner?.name || 'Unknown',
      ownerRegion: owner?.region || '',
      ownerRole: owner?.role || ''
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/referrals/validate?code=CODE - Validate referral code via query param
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Resolve referral code
    const referralCode = await referralCodeUtils.resolveReferralCode(code)

    if (!referralCode || !referralCode.active) {
      return NextResponse.json({
        valid: false,
        message: 'Referral code not found or inactive'
      })
    }

    // Populate owner information if not already populated
    if (!referralCode.ownerUserId || typeof referralCode.ownerUserId === 'string') {
      await referralCode.populate('ownerUserId', 'name region role')
    }

    const owner = referralCode.ownerUserId as any

    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      codeType: referralCode.type,
      region: referralCode.region,
      ownerName: owner?.name || 'Unknown',
      ownerRegion: owner?.region || '',
      ownerRole: owner?.role || ''
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}