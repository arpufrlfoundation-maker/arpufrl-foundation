import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserStatus, UserRole, RoleHierarchy } from '@/models/User'

/**
 * Get all pending users that the current user can approve
 * Only users higher in hierarchy can approve lower users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN and coordinators can view pending users
    if (session.user.role === UserRole.DONOR) {
      return NextResponse.json(
        { error: 'You do not have permission to view pending users' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    // Get current user's hierarchy level
    const currentUserLevel = RoleHierarchy[session.user.role as keyof typeof RoleHierarchy]

    // Fetch all pending users that are lower in hierarchy
    const pendingUsersQuery = await User.find({
      status: UserStatus.PENDING
    })
      .select('_id name email phone fatherPhone motherPhone role region status createdAt parentCoordinatorId referralCode')
      .sort({ createdAt: -1 })
      .lean()

    // Filter users based on hierarchy
    // Only show users who are lower in hierarchy than current user
    const filteredUsers = pendingUsersQuery.filter(user => {
      const userLevel = RoleHierarchy[user.role as keyof typeof RoleHierarchy]
      return userLevel > currentUserLevel
    })

    // Fetch parent coordinator names
    const usersWithParentInfo = await Promise.all(
      filteredUsers.map(async (user) => {
        let parentCoordinatorName = null
        if (user.parentCoordinatorId) {
          const parent = await User.findById(user.parentCoordinatorId).select('name').lean()
          parentCoordinatorName = parent?.name || null
        }

        return {
          ...user,
          _id: user._id.toString(),
          parentCoordinatorId: user.parentCoordinatorId?.toString(),
          parentCoordinatorName
        }
      })
    )

    return NextResponse.json(
      {
        users: usersWithParentInfo,
        count: usersWithParentInfo.length
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Fetch pending users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending users' },
      { status: 500 }
    )
  }
}
