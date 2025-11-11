import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

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
      query.isApproved = false
    } else if (status === 'approved') {
      query.isApproved = true
    }

    // Get sub-coordinators
    const subCoordinators = await User.find(query)
      .select('name email isApproved createdAt donationCount totalDonations')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await User.countDocuments(query)

    // Get stats
    const pendingCount = await User.countDocuments({
      referredBy: session.user.id,
      role: 'coordinator',
      isApproved: false
    })

    const approvedCount = await User.countDocuments({
      referredBy: session.user.id,
      role: 'coordinator',
      isApproved: true
    })

    return NextResponse.json({
      subCoordinators: subCoordinators.map(coord => ({
        id: coord._id.toString(),
        name: coord.name,
        email: coord.email,
        isApproved: coord.isApproved,
        joinedDate: coord.createdAt,
        donationCount: coord.donationCount || 0,
        totalDonations: coord.totalDonations || 0
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
      coordinator.isApproved = true
      await coordinator.save()

      return NextResponse.json({
        success: true,
        message: 'Sub-coordinator approved successfully',
        coordinator: {
          id: coordinator._id.toString(),
          name: coordinator.name,
          email: coordinator.email,
          isApproved: coordinator.isApproved
        }
      })
    } else {
      // For reject, we could either delete or mark as rejected
      // For now, we'll just mark as not approved
      coordinator.isApproved = false
      await coordinator.save()

      return NextResponse.json({
        success: true,
        message: 'Sub-coordinator rejected',
        coordinator: {
          id: coordinator._id.toString(),
          name: coordinator.name,
          email: coordinator.email,
          isApproved: coordinator.isApproved
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
