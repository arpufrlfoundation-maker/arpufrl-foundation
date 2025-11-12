import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { User, UserRole, UserStatus } from '../../../../../models/User'
import { Donation } from '../../../../../models/Donation'

export async function GET(request: NextRequest) {
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

    // Get statistics for ALL users (not just coordinators)
    const [
      totalCoordinators,
      activeCoordinators,
      donationStats
    ] = await Promise.all([
      User.countDocuments({}), // All users
      User.countDocuments({
        status: UserStatus.ACTIVE
      }),
      // Get donation attribution statistics
      Donation.aggregate([
        {
          $lookup: {
            from: 'referralcodes',
            localField: 'referralCodeId',
            foreignField: '_id',
            as: 'referralCode'
          }
        },
        {
          $match: {
            paymentStatus: 'SUCCESS',
            referralCodeId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalDonationsAttributed: { $sum: 1 },
            totalAmountAttributed: { $sum: '$amount' }
          }
        }
      ])
    ])

    const attributionStats = donationStats[0] || {
      totalDonationsAttributed: 0,
      totalAmountAttributed: 0
    }

    const stats = {
      totalCoordinators, // Total users count
      activeCoordinators, // Active users count
      totalDonationsAttributed: attributionStats.totalDonationsAttributed,
      totalAmountAttributed: attributionStats.totalAmountAttributed
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Coordinator stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coordinator statistics' },
      { status: 500 }
    )
  }
}