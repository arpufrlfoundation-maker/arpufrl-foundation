import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { User, UserRole, UserStatus } from '../../../../../models/User'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Validate the user ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate update fields
    const allowedUpdates = ['status', 'role', 'region']
    const updates: any = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'status' && !Object.values(UserStatus).includes(value as any)) {
          return NextResponse.json(
            { error: `Invalid status: ${value}` },
            { status: 400 }
          )
        }
        if (key === 'role' && !Object.values(UserRole).includes(value as any)) {
          return NextResponse.json(
            { error: `Invalid role: ${value}` },
            { status: 400 }
          )
        }
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Prevent admin from changing their own role or status
    if (user._id.toString() === session.user.id) {
      if (updates.role && updates.role !== user.role) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400 }
        )
      }
      if (updates.status && updates.status !== user.status) {
        return NextResponse.json(
          { error: 'Cannot change your own status' },
          { status: 400 }
        )
      }
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-hashedPassword')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        region: updatedUser.region,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Validate the user ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user has dependent records (coordinators, donations, etc.)
    const hasSubCoordinators = await User.countDocuments({
      parentCoordinatorId: user._id
    })

    if (hasSubCoordinators > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with sub-coordinators. Please reassign them first.' },
        { status: 400 }
      )
    }

    // Delete the user
    await User.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}