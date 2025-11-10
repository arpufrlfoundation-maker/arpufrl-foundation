import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserStatus, UserRole, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'

/**
 * Approve a pending user
 * Only users higher in hierarchy can approve
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

    // Only coordinators and admins can approve users
    if (session.user.role === UserRole.DONOR) {
      return NextResponse.json(
        { error: 'You do not have permission to approve users' },
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

    // Find the user to approve
    const userToApprove = await User.findById(userId)

    if (!userToApprove) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already active
    if (userToApprove.status === UserStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'User is already active' },
        { status: 400 }
      )
    }

    // Check if user is pending
    if (userToApprove.status !== UserStatus.PENDING) {
      return NextResponse.json(
        { error: 'Only pending users can be approved' },
        { status: 400 }
      )
    }

    // Verify hierarchy - approver must be higher than the user
    const approverLevel = RoleHierarchy[session.user.role as keyof typeof RoleHierarchy]
    const userLevel = RoleHierarchy[userToApprove.role as keyof typeof RoleHierarchy]

    if (approverLevel >= userLevel) {
      return NextResponse.json(
        { error: 'You can only approve users lower in the hierarchy' },
        { status: 403 }
      )
    }

    // Update user status to ACTIVE
    userToApprove.status = UserStatus.ACTIVE
    userToApprove.updatedAt = new Date()
    await userToApprove.save()

    return NextResponse.json(
      {
        message: 'User approved successfully',
        user: {
          id: userToApprove._id.toString(),
          name: userToApprove.name,
          email: userToApprove.email,
          role: userToApprove.role,
          status: userToApprove.status
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    )
  }
}
