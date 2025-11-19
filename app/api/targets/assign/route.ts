import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target, { HierarchyLevel, TargetStatus } from '@/models/Target'
import { User, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'

/**
 * GET /api/targets/assign
 * Get all assigned targets (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Only allow admins to view all assigned targets
    if (session.user.id !== 'demo-admin') {
      const user = await User.findById(session.user.id)
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        )
      }
    }

    // Fetch all targets
    const allTargets = await Target.find({})
      .populate('assignedTo', 'name email role state district zone block')
      .sort({ createdAt: -1 })
      .limit(200)

    // Manually populate assignedBy for non-demo-admin
    const targets = await Promise.all(
      allTargets.map(async (target) => {
        if (target.assignedBy && target.assignedBy.toString() !== 'demo-admin') {
          await target.populate('assignedBy', 'name email role')
        }
        return target
      })
    )

    return NextResponse.json({
      success: true,
      targets,
      count: targets.length
    })

  } catch (error: any) {
    console.error('Error fetching assigned targets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch targets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/targets/assign
 * Assign a target to a user or multiple users
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await req.json()
    const {
      assignedTo,      // Single user ID or array of user IDs
      targetAmount,    // Total target amount
      subdivisions,    // Array of { userId, amount } for dividing target
      startDate,
      endDate,
      description
    } = body

    // Validate input
    if (!targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid target amount is required' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Get the assigner (current user)
    let assigner
    if (session.user.id === 'demo-admin') {
      // Create a virtual admin user for demo-admin
      assigner = {
        _id: 'demo-admin',
        role: 'ADMIN',
        name: 'Demo Administrator'
      }
    } else {
      assigner = await User.findById(session.user.id)
      if (!assigner) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Case 1: Assign to a single user
    if (assignedTo && typeof assignedTo === 'string') {
      const targetUser = await User.findById(assignedTo)
      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 404 }
        )
      }

      // Check if assigner can assign to this user (must be superior)
      const assignerLevel = RoleHierarchy[assigner.role as keyof typeof RoleHierarchy] || 99
      const targetLevel = RoleHierarchy[targetUser.role as keyof typeof RoleHierarchy] || 99

      if (assignerLevel >= targetLevel && assigner.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You can only assign targets to your subordinates' },
          { status: 403 }
        )
      }

      // Determine hierarchy level based on role
      const hierarchyLevel = mapRoleToHierarchy(targetUser.role)

      // Create the target
      const target = await Target.create({
        assignedTo: targetUser._id,
        assignedBy: session.user.id === 'demo-admin' ? 'demo-admin' : assigner._id,
        targetAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || `Target assigned by ${assigner.name}`,
        level: hierarchyLevel,
        region: {
          state: targetUser.state,
          zone: targetUser.zone,
          district: targetUser.district,
          block: targetUser.block,
          village: targetUser.revenueVillage
        },
        status: TargetStatus.PENDING
      })

      await target.populate('assignedTo', 'name email role')
      // Only populate assignedBy if it's not demo-admin
      if (target.assignedBy && target.assignedBy.toString() !== 'demo-admin') {
        await target.populate('assignedBy', 'name email role')
      }

      return NextResponse.json({
        success: true,
        message: 'Target assigned successfully',
        target
      })
    }

    // Case 2: Subdivide target among multiple users
    if (subdivisions && Array.isArray(subdivisions)) {
      // Validate total doesn't exceed parent target
      const totalSubdivision = subdivisions.reduce((sum, sub) => sum + sub.amount, 0)
      if (totalSubdivision > targetAmount) {
        return NextResponse.json(
          { error: 'Total subdivisions exceed target amount' },
          { status: 400 }
        )
      }

      // Validate all users exist and are subordinates
      const userIds = subdivisions.map(sub => sub.userId)
      const users = await User.find({ _id: { $in: userIds } })

      if (users.length !== subdivisions.length) {
        return NextResponse.json(
          { error: 'One or more users not found' },
          { status: 404 }
        )
      }

      // Check all users are subordinates
      const assignerLevel = RoleHierarchy[assigner.role as keyof typeof RoleHierarchy] || 99
      for (const user of users) {
        const userLevel = RoleHierarchy[user.role as keyof typeof RoleHierarchy] || 99
        if (assignerLevel >= userLevel && assigner.role !== 'ADMIN') {
          return NextResponse.json(
            { error: `Cannot assign target to ${user.name} - not a subordinate` },
            { status: 403 }
          )
        }
      }

      // Create parent target for the assigner (if not demo-admin)
      let parentTarget = null
      if (session.user.id !== 'demo-admin') {
        parentTarget = await Target.create({
          assignedTo: assigner._id,
          assignedBy: assigner._id,
          targetAmount,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description: description || `Total target for team`,
          level: mapRoleToHierarchy(assigner.role),
          region: {
            state: assigner.state,
            zone: assigner.zone,
            district: assigner.district,
            block: assigner.block
          },
          status: TargetStatus.PENDING,
          isDivided: true
        })
      }

      // Create targets for each subdivision
      const createdTargets = []
      for (const subdivision of subdivisions) {
        const user = users.find(u => u._id.toString() === subdivision.userId)
        if (!user) continue

        const target = await Target.create({
          assignedTo: user._id,
          assignedBy: session.user.id === 'demo-admin' ? 'demo-admin' : assigner._id,
          targetAmount: subdivision.amount,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description: subdivision.description || description || `Target assigned by ${assigner.name}`,
          level: mapRoleToHierarchy(user.role),
          region: {
            state: user.state,
            zone: user.zone,
            district: user.district,
            block: user.block,
            village: user.revenueVillage
          },
          parentTargetId: parentTarget?._id,
          status: TargetStatus.PENDING
        })

        await target.populate('assignedTo', 'name email role')
        // Only populate assignedBy if it's not demo-admin
        if (target.assignedBy && target.assignedBy.toString() !== 'demo-admin') {
          await target.populate('assignedBy', 'name email role')
        }
        createdTargets.push(target)
      }

      // Update parent target with subdivisions (if exists)
      if (parentTarget) {
        parentTarget.subdivisions = createdTargets.map(t => t._id)
        await parentTarget.save()
      }

      return NextResponse.json({
        success: true,
        message: `Target divided among ${createdTargets.length} members`,
        parentTarget,
        targets: createdTargets
      })
    }

    return NextResponse.json(
      { error: 'Invalid request: provide either assignedTo or subdivisions' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error assigning target:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign target' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to map user role to hierarchy level
 */
function mapRoleToHierarchy(role: string): string {
  const mapping: Record<string, string> = {
    'CENTRAL_PRESIDENT': HierarchyLevel.NATIONAL,
    'STATE_PRESIDENT': HierarchyLevel.STATE,
    'STATE_COORDINATOR': HierarchyLevel.STATE_COORD,
    'ZONE_COORDINATOR': HierarchyLevel.ZONE,
    'DISTRICT_PRESIDENT': HierarchyLevel.DISTRICT_PRES,
    'DISTRICT_COORDINATOR': HierarchyLevel.DISTRICT_COORD,
    'BLOCK_COORDINATOR': HierarchyLevel.BLOCK,
    'NODAL_OFFICER': HierarchyLevel.NODAL,
    'PRERAK': HierarchyLevel.PRERAK,
    'PRERNA_SAKHI': HierarchyLevel.PRERNA,
    'VOLUNTEER': HierarchyLevel.VOLUNTEER
  }

  return mapping[role] || HierarchyLevel.VOLUNTEER
}
