import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../lib/auth'
import { connectToDatabase } from '../../../../../../lib/db'
import { User, UserRole, UserStatus } from '../../../../../../models/User'

export async function POST(
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
    if (![UserRole.COORDINATOR, UserRole.SUB_COORDINATOR].includes(coordinator.role as any)) {
      return NextResponse.json(
        { error: 'User is not a coordinator' },
        { status: 400 }
      )
    }

    // Check if coordinator is pending
    if (coordinator.status !== UserStatus.PENDING) {
      return NextResponse.json(
        { error: 'Coordinator is not pending approval' },
        { status: 400 }
      )
    }

    // Update coordinator status to inactive (rejected)
    coordinator.status = UserStatus.INACTIVE
    await coordinator.save()

    return NextResponse.json({
      message: 'Coordinator rejected successfully',
      coordinator: {
        id: coordinator._id.toString(),
        name: coordinator.name,
        email: coordinator.email,
        status: coordinator.status
      }
    })

  } catch (error) {
    console.error('Reject coordinator error:', error)
    return NextResponse.json(
      { error: 'Failed to reject coordinator' },
      { status: 500 }
    )
  }
}