import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole } from '@/models/User'
import { Donation, PaymentStatus } from '@/models/Donation'
import { ReferralCode } from '@/models/ReferralCode'
import { Program } from '@/models/Program'
import mongoose from 'mongoose'

// GET /api/referrals/analytics - Get referral analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeRange = searchParams.get('timeRange') || '30d'

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Check if user can access this data
    const canAccess =
      currentUser.role === UserRole.ADMIN ||
      currentUser._id.toString() === userId ||
      (currentUser.role === UserRole.COORDINATOR &&
        targetUser.parentCoordinatorId?.toString() === currentUser._id.toString())

    if (!canAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Calculate date range
    const days = getTimeRangeDays(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all users in the hierarchy (user + sub-coordinators)
    const hierarchyUserIds = [new mongoose.Types.ObjectId(userId)]

    if (targetUser.role === UserRole.COORDINATOR) {
      const subCoordinators = await User.find({
        parentCoordinatorId: userId,
        role: UserRole.SUB_COORDINATOR
      }).select('_id')

      hierarchyUserIds.push(...subCoordinators.map(sc => sc._id))
    }

    // Get overview statistics
    const overviewStats = await Donation.aggregate([
      {
        $match: {
          attributedToUserId: { $in: hierarchyUserIds },
          paymentStatus: PaymentStatus.SUCCESS,
          createdAt: { $gte: startDate }
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

    // Get conversion rate (assuming we track referral code views/clicks)
    const referralCodes = await ReferralCode.find({
      ownerUserId: { $in: hierarchyUserIds }
    })

    const totalCodeUsage = referralCodes.reduce((sum, code) => sum + code.totalDonations, 0)
    const conversionRate = totalCodeUsage > 0 ? (overviewStats[0]?.totalDonations || 0) / totalCodeUsage * 100 : 0

    // Get active sub-coordinators count
    const activeSubCoordinators = await User.countDocuments({
      parentCoordinatorId: userId,
      role: UserRole.SUB_COORDINATOR,
      status: 'ACTIVE'
    })

    // Get daily trends
    const trends = await Donation.aggregate([
      {
        $match: {
          attributedToUserId: { $in: hierarchyUserIds },
          paymentStatus: PaymentStatus.SUCCESS,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          amount: { $sum: '$amount' },
          donations: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          date: '$_id',
          amount: 1,
          donations: 1,
          _id: 0
        }
      }
    ])

    // Get top performing sub-coordinators
    const topPerformers = await Donation.aggregate([
      {
        $match: {
          attributedToUserId: { $in: hierarchyUserIds.slice(1) }, // Exclude main coordinator
          paymentStatus: PaymentStatus.SUCCESS,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$attributedToUserId',
          totalAmount: { $sum: '$amount' },
          totalDonations: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'referralcodes',
          localField: '_id',
          foreignField: 'ownerUserId',
          as: 'referralCode'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          name: '$user.name',
          totalAmount: 1,
          totalDonations: 1,
          conversionRate: {
            $cond: {
              if: { $gt: [{ $size: '$referralCode' }, 0] },
              then: {
                $multiply: [
                  { $divide: ['$totalDonations', { $arrayElemAt: ['$referralCode.totalDonations', 0] }] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 5
      }
    ])

    // Get recent donations with details
    const recentDonations = await Donation.find({
      attributedToUserId: { $in: hierarchyUserIds },
      paymentStatus: PaymentStatus.SUCCESS,
      createdAt: { $gte: startDate }
    })
      .populate('programId', 'name')
      .populate('attributedToUserId', 'name')
      .populate('referralCodeId', 'code')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('donorName amount createdAt programId referralCodeId attributedToUserId')

    // Get referral code usage statistics
    const codeUsage = await ReferralCode.aggregate([
      {
        $match: {
          ownerUserId: { $in: hierarchyUserIds },
          active: true
        }
      },
      {
        $lookup: {
          from: 'donations',
          let: { codeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$referralCodeId', '$$codeId'] },
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: { $gte: startDate }
              }
            }
          ],
          as: 'donations'
        }
      },
      {
        $project: {
          code: 1,
          usageCount: { $size: '$donations' },
          totalAmount: { $sum: '$donations.amount' },
          lastUsed: { $max: '$donations.createdAt' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ])

    // Format response
    const overview = overviewStats[0] || {
      totalAmount: 0,
      totalDonations: 0,
      averageDonation: 0
    }

    const analyticsData = {
      overview: {
        ...overview,
        conversionRate,
        activeSubCoordinators
      },
      trends,
      topPerformers,
      recentDonations: recentDonations.map(donation => ({
        id: donation._id.toString(),
        donorName: donation.donorName,
        amount: donation.amount,
        createdAt: donation.createdAt.toISOString(),
        programName: (donation.programId as any)?.name || 'Unknown Program',
        referralCode: (donation.referralCodeId as any)?.code || 'N/A',
        attributedTo: (donation.attributedToUserId as any)?.name || 'Unknown'
      })),
      codeUsage
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching referral analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTimeRangeDays(timeRange: string): number {
  switch (timeRange) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case '1y':
      return 365
    default:
      return 30
  }
}