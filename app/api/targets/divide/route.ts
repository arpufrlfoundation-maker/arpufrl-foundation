import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Target, TargetType, TargetStatus } from '@/models/Target'
import { User } from '@/models/User'

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
    const { parentTargetId, divisions } = body

    // divisions is an array of: { assignedToId, amount, level, region, description }

    if (!parentTargetId || !divisions || !Array.isArray(divisions) || divisions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Get the parent target
    const parentTarget = await Target.findById(parentTargetId)
    if (!parentTarget) {
      return NextResponse.json(
        { error: 'Parent target not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (parentTarget.assignedTo.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only divide your own targets' },
        { status: 403 }
      )
    }

    // Check if already divided
    if (parentTarget.isDivided) {
      return NextResponse.json(
        { error: 'This target has already been divided' },
        { status: 409 }
      )
    }

    // Calculate total division amount
    const totalDivisionAmount = divisions.reduce((sum: number, div: any) => sum + div.amount, 0)

    // Validate: total divisions shouldn't exceed parent target
    if (totalDivisionAmount > parentTarget.targetValue) {
      return NextResponse.json(
        {
          error: 'Total division amount exceeds parent target',
          parentTarget: parentTarget.targetValue,
          totalDivisions: totalDivisionAmount
        },
        { status: 400 }
      )
    }

    // Validate all assignees exist and are team members (users who have this user as parent)
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get team members (users who have this user as parent coordinator)
    const teamMembers = await User.find({ parentCoordinatorId: session.user.id }).select('_id')
    const teamMemberIds = teamMembers.map(member => member._id.toString())

    for (const division of divisions) {
      if (!teamMemberIds.includes(division.assignedToId)) {
        return NextResponse.json(
          { error: `User ${division.assignedToId} is not in your team` },
          { status: 400 }
        )
      }
    }

    // Create child targets
    const createdTargets = []

    for (const division of divisions) {
      // Check if user already has an active target
      const existingTarget = await Target.findOne({
        assignedTo: division.assignedToId,
        type: TargetType.DONATION_AMOUNT,
        status: { $in: [TargetStatus.IN_PROGRESS, TargetStatus.PENDING] }
      })

      if (existingTarget) {
        return NextResponse.json(
          {
            error: `User ${division.assignedToId} already has an active target`,
            existingTargetId: existingTarget._id
          },
          { status: 409 }
        )
      }

      const childTarget = await Target.create({
        assignedTo: division.assignedToId,
        assignedBy: session.user.id,
        parentTargetId: parentTargetId,
        type: TargetType.DONATION_AMOUNT,
        targetValue: division.amount,
        currentValue: 0,
        collectedAmount: 0,
        teamCollectedAmount: 0,
        status: TargetStatus.PENDING,
        startDate: parentTarget.startDate,
        endDate: parentTarget.endDate,
        description: division.description || `Sub-target from ${user.name}`,
        level: division.level,
        region: division.region || parentTarget.region || {},
        isDivided: false,
        subdivisions: []
      })

      await childTarget.populate('assignedTo', 'name email role')
      createdTargets.push(childTarget)
    }

    // Update parent target
    parentTarget.isDivided = true
    parentTarget.subdivisions = createdTargets.map((t: any) => t._id)
    await parentTarget.save()

    return NextResponse.json({
      success: true,
      message: 'Target divided successfully',
      parentTarget: {
        id: parentTarget._id,
        amount: parentTarget.targetValue,
        divided: parentTarget.isDivided
      },
      childTargets: createdTargets.map(target => ({
        id: target._id,
        assignedTo: {
          id: (target.assignedTo as any)._id,
          name: (target.assignedTo as any).name,
          email: (target.assignedTo as any).email
        },
        amount: target.targetValue,
        level: target.level,
        region: target.region,
        startDate: target.startDate,
        endDate: target.endDate
      })),
      totalDivided: totalDivisionAmount,
      remaining: parentTarget.targetValue - totalDivisionAmount
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error dividing target:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
