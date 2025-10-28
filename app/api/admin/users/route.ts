import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { connectToDatabase } from '../../../../lib/db'
import { User, UserRole } from '../../../../models/User'

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

    // Build filter query
    const filter: any = {}

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

    // Execute aggregation pipeline to get users with parent coordinator info
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
        $addFields: {
          parentCoordinatorName: { $arrayElemAt: ['$parentCoordinator.name', 0] }
        }
      },
      { $sort: { createdAt: -1 as const } },
      {
        $facet: {
          users: [
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
                emailVerified: 1,
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
    const users = result.users || []
    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Format response
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      region: user.region,
      parentCoordinatorId: user.parentCoordinatorId?.toString(),
      parentCoordinatorName: user.parentCoordinatorName,
      emailVerified: user.emailVerified?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}