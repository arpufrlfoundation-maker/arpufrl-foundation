import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { connectToDatabase } from '../../../../lib/db'
import { User, UserRole } from '../../../../models/User'
import { Donation } from '../../../../models/Donation'
import { ReferralCode } from '../../../../models/ReferralCode'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Filter parameters
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const region = searchParams.get('region') || ''

    // Build filter query for coordinators only
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

    const filter: any = {
      role: { $in: coordinatorRoles }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Role filter
    if (role) {
      filter.role = role
    }

    // Status filter
    if (status) {
      filter.status = status
    }

    // Region filter
    if (region) {
      filter.region = region
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute aggregation pipeline to get coordinators with performance data
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'parentCoordinatorId',
          foreignField: '_id',
          as: 'parentCoordinator'
        }
      },
      {
        $lookup: {
          from: 'referralcodes',
          localField: '_id',
          foreignField: 'ownerUserId',
          as: 'referralCodes'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'parentCoordinatorId',
          as: 'subCoordinators'
        }
      },
      {
        $addFields: {
          parentCoordinatorName: { $arrayElemAt: ['$parentCoordinator.name', 0] },
          referralCode: { $arrayElemAt: ['$referralCodes.code', 0] },
          subCoordinatorsCount: { $size: '$subCoordinators' }
        }
      },
      { $sort: { createdAt: -1 as const } },
      {
        $facet: {
          coordinators: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                role: 1,
                status: 1,
                region: 1,
                parentCoordinatorId: 1,
                parentCoordinatorName: 1,
                referralCode: 1,
                subCoordinatorsCount: 1,
                createdAt: 1,
                updatedAt: 1
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ]

    const [result] = await User.aggregate(pipeline)
    const coordinators = result.coordinators || []
    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get performance data for each coordinator
    const coordinatorIds = coordinators.map((c: any) => c._id)

    // Get donation statistics for coordinators
    const donationStats = await Donation.aggregate([
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
          'referralCode.ownerUserId': { $in: coordinatorIds }
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$referralCode.ownerUserId', 0] },
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          monthlyDonations: {
            $sum: {
              $cond: {
                if: {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                then: 1,
                else: 0
              }
            }
          },
          monthlyAmount: {
            $sum: {
              $cond: {
                if: {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                then: '$amount',
                else: 0
              }
            }
          }
        }
      }
    ])

    // Create a map of coordinator performance
    const performanceMap = new Map()
    donationStats.forEach((stat: any) => {
      performanceMap.set(stat._id.toString(), {
        totalDonations: stat.totalDonations,
        totalAmount: stat.totalAmount,
        monthlyDonations: stat.monthlyDonations,
        monthlyAmount: stat.monthlyAmount
      })
    })

    // Format response with performance data
    const formattedCoordinators = coordinators.map((coordinator: any) => {
      const performance = performanceMap.get(coordinator._id.toString()) || {
        totalDonations: 0,
        totalAmount: 0,
        monthlyDonations: 0,
        monthlyAmount: 0
      }

      return {
        id: coordinator._id.toString(),
        name: coordinator.name,
        email: coordinator.email,
        phone: coordinator.phone,
        role: coordinator.role,
        status: coordinator.status,
        region: coordinator.region,
        parentCoordinatorId: coordinator.parentCoordinatorId?.toString(),
        parentCoordinatorName: coordinator.parentCoordinatorName,
        referralCode: coordinator.referralCode,
        subCoordinatorsCount: coordinator.subCoordinatorsCount,
        totalDonations: performance.totalDonations,
        totalAmount: performance.totalAmount,
        monthlyDonations: performance.monthlyDonations,
        monthlyAmount: performance.monthlyAmount,
        createdAt: coordinator.createdAt.toISOString(),
        updatedAt: coordinator.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      coordinators: formattedCoordinators,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Coordinators API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coordinators' },
      { status: 500 }
    )
  }
}