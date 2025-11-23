import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import VolunteerRequest, { VolunteerRequestStatus } from '@/models/VolunteerRequest'

// Update request validation schema
const updateRequestSchema = z.object({
  status: z.enum([
    VolunteerRequestStatus.PENDING,
    VolunteerRequestStatus.REVIEWED,
    VolunteerRequestStatus.ACCEPTED,
    VolunteerRequestStatus.REJECTED
  ]),
  notes: z.string().max(500).optional(),
  parentCoordinatorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  assignedRole: z.enum(['VOLUNTEER', 'BLOCK_COORDINATOR', 'NODAL_OFFICER', 'PRERAK', 'PRERNA_SAKHI']).optional()
})

/**
 * PATCH /api/volunteer/requests/[id]
 * Update volunteer request status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Check if user is authenticated and is admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.id !== 'demo-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin only.' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = updateRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { status, notes, parentCoordinatorId, assignedRole } = validationResult.data
    const { id } = await params

    // Find and update volunteer request
    const volunteerRequest = await VolunteerRequest.findById(id)

    if (!volunteerRequest) {
      return NextResponse.json(
        { success: false, error: 'Volunteer request not found' },
        { status: 404 }
      )
    }

    // Update status
    volunteerRequest.status = status
    if (notes !== undefined) {
      volunteerRequest.notes = notes
    }

    // Set review info if status changed from PENDING
    if (volunteerRequest.isModified('status') && status !== VolunteerRequestStatus.PENDING) {
      volunteerRequest.reviewedAt = new Date()
      // Only set reviewedBy if not demo-admin
      if (session.user.id !== 'demo-admin') {
        volunteerRequest.reviewedBy = session.user.id as any
      }
    }

    await volunteerRequest.save()

    // If accepted, create user account
    let createdUser = null
    if (status === VolunteerRequestStatus.ACCEPTED) {
      try {
        const { User, UserRole, UserStatus } = await import('@/models/User')
        const { ReferralCode } = await import('@/models/ReferralCode')
        const bcrypt = await import('bcryptjs')
        const mongoose = await import('mongoose')

        // Check if user already exists
        const existingUser = await User.findOne({ email: volunteerRequest.email })

        if (!existingUser) {
          // Determine role - default to VOLUNTEER if not specified
          const userRole = assignedRole || UserRole.VOLUNTEER

          // Create user account with default password
          const hashedPassword = await bcrypt.hash('Password123!', 12)

          const userData: any = {
            name: volunteerRequest.name,
            email: volunteerRequest.email,
            phone: volunteerRequest.phone,
            state: volunteerRequest.state,
            city: volunteerRequest.city,
            role: userRole,
            status: UserStatus.ACTIVE,
            hashedPassword,
            emailVerified: new Date()
          }

          // Add parent coordinator if provided
          if (parentCoordinatorId) {
            userData.parentCoordinatorId = new mongoose.Types.ObjectId(parentCoordinatorId)
          }

          const newUser = await User.create(userData)

          // Create referral code with parent if specified
          const parentId = parentCoordinatorId ? new mongoose.Types.ObjectId(parentCoordinatorId) : undefined
          await ReferralCode.createForUser(newUser._id, parentId)

          createdUser = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            parentCoordinatorId: newUser.parentCoordinatorId
          }

          console.log(`Created user account for volunteer: ${newUser.email} with role ${userRole}`)
        }
      } catch (userCreationError) {
        console.error('Failed to create user account:', userCreationError)
        // Don't fail the request if user creation fails
      }
    }

    // TODO: Send status update email to volunteer

    return NextResponse.json({
      success: true,
      message: 'Volunteer request updated successfully',
      data: {
        id: volunteerRequest._id,
        status: volunteerRequest.status,
        reviewedAt: volunteerRequest.reviewedAt,
        userCreated: !!createdUser,
        user: createdUser
      }
    })

  } catch (error) {
    console.error('Error updating volunteer request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update volunteer request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/volunteer/requests/[id]
 * Delete volunteer request (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Check if user is authenticated and is admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== 'demo-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin only.' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const { id } = await params
    const volunteerRequest = await VolunteerRequest.findByIdAndDelete(id)

    if (!volunteerRequest) {
      return NextResponse.json(
        { success: false, error: 'Volunteer request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Volunteer request deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting volunteer request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete volunteer request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
