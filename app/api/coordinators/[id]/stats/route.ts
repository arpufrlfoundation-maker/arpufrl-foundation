import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'
import { Donation } from '@/models/Donation'
import mongoose from 'mongoose'

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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if user exists and is a coordinator
    const coordinator = await User.findById(id)
    if (!coordinator) {
      return NextResponse.json({ error: 'Coordinator not found' }, { status: 404 })
    }

    if (!coordinatorRoles.includes(coordinator.role as any)) {
      return NextResponse.json({ error: 'User is not a coordinator' }, { status: 400 })
    }

    // Check permissions - users can only view their own stats, admins can view all
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser._id.toString() !== id) {
      // Higher level coordinators can view their subordinates' stats
      if (coordinatorRoles.includes(currentUser.role as any) && coordinator.parentCoordinatorId?.toString() !== currentUser._id.toString()) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      } else if (currentUser.role === UserRole.VOLUNTEER) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Get coordinator's referral code
    const referralCode = await ReferralCode.findActiveByOwner(new mongoose.Types.ObjectId(id))
    if (!referralCode) {
      return NextResponse.json({
        totalRaised: 0,
        totalDonations: 0,
        averageDonation: 0,
        subCoordinators: 0,
        thisMonthRaised: 0,
        thisMonthDonations: 0
      })
    }

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get all donations attributed to this coordinator
    const [totalStats, monthlyStats, subCoordinatorCount, rankingData] = await Promise.all([
      // Total stats
      Donation.aggregate([
        {
          $match: {
            referralCodeId: referralCode._id,
            paymentStatus: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]),

      // Monthly stats
      Donation.aggregate([
        {
          $match: {
            referralCodeId: referralCode._id,
            paymentStatus: 'SUCCESS',
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth
            }
          }
        },
        {
          $group: {
            _id: null,
            monthlyAmount: { $sum: '$amount' },
            monthlyCount: { $sum: 1 }
          }
        }
      ]),

      // Subordinates count (users under this coordinator)
      User.countDocuments({
        parentCoordinatorId: new mongoose.Types.ObjectId(id),
        status: 'ACTIVE'
      }),

      // Ranking data - get all coordinators' performance for ranking
      ReferralCode.aggregate([
        {
          $match: {
            active: true,
            type: coordinator.role
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerUserId',
            foreignField: '_id',
            as: 'owner'
          }
        },
        {
          $unwind: '$owner'
        },
        {
          $match: {
            'owner.status': 'ACTIVE'
          }
        },
        {
          $project: {
            ownerUserId: 1,
            totalAmount: 1
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ])
    ])

    // Process results
    const total = totalStats[0] || { totalAmount: 0, totalCount: 0 }
    const monthly = monthlyStats[0] || { monthlyAmount: 0, monthlyCount: 0 }

    // Calculate ranking
    let rank = null
    let totalCoordinators = null

    if (rankingData.length > 0) {
      totalCoordinators = rankingData.length
      const coordinatorIndex = rankingData.findIndex(
        (item: any) => item.ownerUserId.toString() === id
      )
      if (coordinatorIndex !== -1) {
        rank = coordinatorIndex + 1
      }
    }

    // Calculate average donation
    const averageDonation = total.totalCount > 0 ? total.totalAmount / total.totalCount : 0

    const stats = {
      totalRaised: total.totalAmount,
      totalDonations: total.totalCount,
      averageDonation: Math.round(averageDonation),
      subCoordinators: subCoordinatorCount,
      thisMonthRaised: monthly.monthlyAmount,
      thisMonthDonations: monthly.monthlyCount,
      rank,
      totalCoordinators
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching coordinator stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}