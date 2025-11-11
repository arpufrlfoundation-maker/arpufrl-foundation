import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Target, TargetType, TargetStatus, HierarchyLevel } from '@/models/Target'
import { User, UserRole } from '@/models/User'

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
    const {
      assignedToId,
      targetAmount,
      startDate,
      endDate,
      description,
      level,
      region
    } = body

    // Validation
    if (!assignedToId || !targetAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be positive' },
        { status: 400 }
      )
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Verify the assignee exists and is subordinate to the assigner
    const assignee = await User.findById(assignedToId)
    if (!assignee) {
      return NextResponse.json(
        { error: 'Assignee not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to assign to this person
    const assigner = await User.findById(session.user.id)
    if (!assigner) {
      return NextResponse.json(
        { error: 'Assigner not found' },
        { status: 404 }
      )
    }

    // Admin can assign to anyone, coordinators can only assign to their team
    if (assigner.role !== UserRole.ADMIN) {
      // Check if the assignee was referred by this assigner
      if (assignee.parentCoordinatorId?.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only assign targets to your team members' },
          { status: 403 }
        )
      }
    }

    // Check if assignee already has an active target
    const existingTarget = await Target.findOne({
      assignedTo: assignedToId,
      type: TargetType.DONATION_AMOUNT,
      status: { $in: [TargetStatus.IN_PROGRESS, TargetStatus.PENDING] }
    })

    if (existingTarget) {
      return NextResponse.json(
        {
          error: 'This user already has an active target',
          existingTarget: {
            id: existingTarget._id,
            amount: existingTarget.targetValue,
            collected: existingTarget.getTotalCollection(),
            endDate: existingTarget.endDate
          }
        },
        { status: 409 }
      )
    }

    // Create the target
    const newTarget = await Target.create({
      assignedTo: assignedToId,
      assignedBy: session.user.id,
      type: TargetType.DONATION_AMOUNT,
      targetValue: targetAmount,
      currentValue: 0,
      collectedAmount: 0,
      teamCollectedAmount: 0,
      status: TargetStatus.PENDING,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description,
      level: level || HierarchyLevel.VOLUNTEER,
      region: region || {},
      isDivided: false,
      subdivisions: []
    })

    // Populate assignee details
    await newTarget.populate('assignedTo', 'name email role')
    await newTarget.populate('assignedBy', 'name email role')

    return NextResponse.json({
      success: true,
      message: 'Target assigned successfully',
      target: {
        id: newTarget._id,
        assignedTo: {
          id: (newTarget.assignedTo as any)._id,
          name: (newTarget.assignedTo as any).name,
          email: (newTarget.assignedTo as any).email,
          role: (newTarget.assignedTo as any).role
        },
        assignedBy: {
          id: (newTarget.assignedBy as any)._id,
          name: (newTarget.assignedBy as any).name
        },
        targetAmount: newTarget.targetValue,
        collectedAmount: newTarget.collectedAmount,
        teamCollectedAmount: newTarget.teamCollectedAmount,
        status: newTarget.status,
        startDate: newTarget.startDate,
        endDate: newTarget.endDate,
        description: newTarget.description,
        level: newTarget.level,
        region: newTarget.region
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning target:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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
    const assignedToId = searchParams.get('assignedTo')
    const status = searchParams.get('status')

    await connectToDatabase()

    let query: any = {}

    // If assignedTo is specified, get that user's targets
    if (assignedToId) {
      query.assignedTo = assignedToId
    } else {
      // Otherwise, get targets assigned by current user
      query.assignedBy = session.user.id
    }

    // Add status filter if provided
    if (status) {
      query.status = status
    } else {
      // By default, show active targets
      query.status = { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
    }

    const targets = await Target.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      targets: targets.map(target => ({
        id: target._id.toString(),
        assignedTo: {
          id: (target.assignedTo as any)._id,
          name: (target.assignedTo as any).name,
          email: (target.assignedTo as any).email,
          role: (target.assignedTo as any).role
        },
        assignedBy: {
          id: (target.assignedBy as any)._id,
          name: (target.assignedBy as any).name
        },
        targetAmount: target.targetValue,
        collectedAmount: target.collectedAmount,
        teamCollectedAmount: target.teamCollectedAmount,
        totalCollected: target.collectedAmount + target.teamCollectedAmount,
        remainingAmount: Math.max(0, target.targetValue - (target.collectedAmount + target.teamCollectedAmount)),
        completionPercentage: target.targetValue > 0 
          ? Math.round(((target.collectedAmount + target.teamCollectedAmount) / target.targetValue) * 100) 
          : 0,
        status: target.status,
        startDate: target.startDate,
        endDate: target.endDate,
        description: target.description,
        level: target.level,
        region: target.region,
        isDivided: target.isDivided,
        subdivisions: target.subdivisions
      }))
    })
  } catch (error: any) {
    console.error('Error fetching targets:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
