import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Target, targetUtils } from '@/models/Target'
import { User, UserRole } from '@/models/User'
import mongoose from 'mongoose'

// GET - Fetch targets for a user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const assignedBy = searchParams.get('assignedBy')
    const status = searchParams.get('status')

    let query: any = {}

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        )
      }
      query.assignedTo = userId
    }

    if (assignedBy) {
      if (!mongoose.Types.ObjectId.isValid(assignedBy)) {
        return NextResponse.json(
          { error: 'Invalid assigned by ID' },
          { status: 400 }
        )
      }
      query.assignedBy = assignedBy
    }

    if (status) {
      query.status = status
    }

    const targets = await Target.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 })

    return NextResponse.json({ targets })
  } catch (error) {
    console.error('Error fetching targets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch targets' },
      { status: 500 }
    )
  }
}

// POST - Create a new target
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate data
    const validation = targetUtils.validateCreationData(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { assignedTo, assignedBy, type, targetValue, startDate, endDate, description } = body

    // Verify both users exist
    const targetUser = await User.findById(assignedTo)
    const assignerUser = await User.findById(assignedBy)

    if (!targetUser || !assignerUser) {
      return NextResponse.json(
        { error: 'Invalid user IDs' },
        { status: 400 }
      )
    }

    // Verify assigner can manage target user
    if (assignerUser.role !== UserRole.ADMIN) {
      const canManage = await assignerUser.canManageUser(targetUser._id)
      if (!canManage) {
        return NextResponse.json(
          { error: 'You do not have permission to assign targets to this user' },
          { status: 403 }
        )
      }
    }

    // Create target
    const target = await Target.createTarget({
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
      assignedBy: new mongoose.Types.ObjectId(assignedBy),
      type,
      targetValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description,
      currentValue: 0,
      status: 'PENDING'
    })

    return NextResponse.json(
      { message: 'Target created successfully', target },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating target:', error)
    return NextResponse.json(
      { error: 'Failed to create target' },
      { status: 500 }
    )
  }
}

// PUT - Update target progress
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { targetId, currentValue, status, notes } = body

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { error: 'Invalid target ID' },
        { status: 400 }
      )
    }

    const target = await Target.findById(targetId)
    if (!target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    // Update fields
    if (currentValue !== undefined) {
      await target.updateProgress(currentValue)
    }

    if (status) {
      target.status = status
    }

    if (notes) {
      target.notes = notes
    }

    await target.save()

    return NextResponse.json({
      message: 'Target updated successfully',
      target
    })
  } catch (error) {
    console.error('Error updating target:', error)
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a target
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { error: 'Invalid target ID' },
        { status: 400 }
      )
    }

    const target = await Target.findByIdAndDelete(targetId)
    if (!target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Target deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting target:', error)
    return NextResponse.json(
      { error: 'Failed to delete target' },
      { status: 500 }
    )
  }
}
