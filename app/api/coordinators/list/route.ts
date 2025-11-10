import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User, UserStatus } from '@/models/User'

/**
 * Get list of active coordinators for parent selection during signup
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Fetch all active coordinators (excluding DONOR role)
    const coordinators = await User.find({
      status: UserStatus.ACTIVE,
      role: { $ne: 'DONOR' }
    })
      .select('_id name email role region referralCode')
      .sort({ role: 1, name: 1 })
      .limit(100)
      .lean()

    return NextResponse.json(
      {
        coordinators: coordinators.map(c => ({
          _id: c._id.toString(),
          name: c.name,
          email: c.email,
          role: c.role,
          region: c.region,
          referralCode: c.referralCode
        }))
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Fetch coordinators error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coordinators' },
      { status: 500 }
    )
  }
}
