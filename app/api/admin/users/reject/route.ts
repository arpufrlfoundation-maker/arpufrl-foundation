import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserStatus, UserRole, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'

/**
 * Reject a pending user
 * Sets user status to INACTIVE
 * Only users higher in hierarchy can reject
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only coordinators and admins can reject users
    if (session.user.role === UserRole.DONOR) {
      return NextResponse.json(
        { error: 'You do not have permission to reject users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find the user to reject
    const userToReject = await User.findById(userId)

    if (!userToReject) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is pending
    if (userToReject.status !== UserStatus.PENDING) {
      return NextResponse.json(
        { error: 'Only pending users can be rejected' },
        { status: 400 }
      )
    }

    // Verify hierarchy - rejector must be higher than the user
    const rejectorLevel = RoleHierarchy[session.user.role as keyof typeof RoleHierarchy]
    const userLevel = RoleHierarchy[userToReject.role as keyof typeof RoleHierarchy]

    if (rejectorLevel >= userLevel) {
      return NextResponse.json(
        { error: 'You can only reject users lower in the hierarchy' },
        { status: 403 }
      )
    }

    // Update user status to INACTIVE
    userToReject.status = UserStatus.INACTIVE
    userToReject.updatedAt = new Date()
    await userToReject.save()

    return NextResponse.json(
      {
        message: 'User rejected successfully',
        user: {
          id: userToReject._id.toString(),
          name: userToReject.name,
          email: userToReject.email,
          role: userToReject.role,
          status: userToReject.status
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reject user error:', error)
    return NextResponse.json(
      { error: 'Failed to reject user' },
      { status: 500 }
    )
  }
}
