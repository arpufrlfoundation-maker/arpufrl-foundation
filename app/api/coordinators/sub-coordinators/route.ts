import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserStatus } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, pending, approved
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build query for sub-coordinators
    const query: any = {
      referredBy: session.user.id,
      role: 'coordinator'
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status === 'pending') {
      query.status = UserStatus.PENDING
    } else if (status === 'approved') {
      query.status = UserStatus.ACTIVE
    }

    // Get sub-coordinators
    const subCoordinators = await User.find(query)
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await User.countDocuments(query)

    // Get stats
    const pendingCount = await User.countDocuments({
      referredBy: session.user.id,
      role: 'coordinator',
      status: UserStatus.PENDING
    })

    const approvedCount = await User.countDocuments({
      referredBy: session.user.id,
      role: 'coordinator',
      status: UserStatus.ACTIVE
    })

    return NextResponse.json({
      subCoordinators: subCoordinators.map(coord => ({
        id: coord._id.toString(),
        name: coord.name,
        email: coord.email,
        isApproved: coord.status === UserStatus.ACTIVE,
        joinedDate: coord.createdAt
      })),
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching sub-coordinators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { coordinatorId, action } = body

    if (!coordinatorId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Verify the coordinator is referred by the current user
    const coordinator = await User.findOne({
      _id: coordinatorId,
      referredBy: session.user.id,
      role: 'coordinator'
    })

    if (!coordinator) {
      return NextResponse.json(
        { error: 'Sub-coordinator not found' },
        { status: 404 }
      )
    }

    // Update approval status
    if (action === 'approve') {
      coordinator.status = UserStatus.ACTIVE
      await coordinator.save()

      return NextResponse.json({
        success: true,
        message: 'Sub-coordinator approved successfully',
        coordinator: {
          id: coordinator._id.toString(),
          name: coordinator.name,
          email: coordinator.email,
          isApproved: true
        }
      })
    } else {
      // For reject, we could either delete or mark as rejected
      // For now, we'll just mark as not approved
      coordinator.status = UserStatus.INACTIVE
      await coordinator.save()

      return NextResponse.json({
        success: true,
        message: 'Sub-coordinator rejected',
        coordinator: {
          id: coordinator._id.toString(),
          name: coordinator.name,
          email: coordinator.email,
          isApproved: false
        }
      })
    }
  } catch (error) {
    console.error('Error updating sub-coordinator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
