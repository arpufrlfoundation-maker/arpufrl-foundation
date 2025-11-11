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

    // Validate the coordinator ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid coordinator ID' },
        { status: 400 }
      )
    }

    // Find the coordinator
    const coordinator = await User.findById(id)
    if (!coordinator) {
      return NextResponse.json(
        { error: 'Coordinator not found' },
        { status: 404 }
      )
    }

    // Check if user is a coordinator
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
    
    if (!coordinatorRoles.includes(coordinator.role as any)) {
      return NextResponse.json(
        { error: 'User is not a coordinator' },
        { status: 400 }
      )
    }

    // Validate update fields
    const allowedUpdates = ['status', 'region']
    const updates: any = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'status' && !Object.values(UserStatus).includes(value as any)) {
          return NextResponse.json(
            { error: `Invalid status: ${value}` },
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

    // Update the coordinator
    const updatedCoordinator = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-hashedPassword')

    if (!updatedCoordinator) {
      return NextResponse.json(
        { error: 'Coordinator not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Coordinator updated successfully',
      coordinator: {
        id: updatedCoordinator._id.toString(),
        name: updatedCoordinator.name,
        email: updatedCoordinator.email,
        role: updatedCoordinator.role,
        status: updatedCoordinator.status,
        region: updatedCoordinator.region,
        createdAt: updatedCoordinator.createdAt.toISOString(),
        updatedAt: updatedCoordinator.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Update coordinator error:', error)
    return NextResponse.json(
      { error: 'Failed to update coordinator' },
      { status: 500 }
    )
  }
}