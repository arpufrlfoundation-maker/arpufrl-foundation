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
  notes: z.string().max(500).optional()
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

    const { status, notes } = validationResult.data
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
      volunteerRequest.reviewedBy = session.user.id === 'demo-admin' ? 'demo-admin' as any : session.user.id as any
    }

    await volunteerRequest.save()

    // TODO: Send status update email to volunteer

    return NextResponse.json({
      success: true,
      message: 'Volunteer request updated successfully',
      data: {
        id: volunteerRequest._id,
        status: volunteerRequest.status,
        reviewedAt: volunteerRequest.reviewedAt
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
