import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole } from '@/models/User'
import { ReferralAttributionService } from '@/lib/referral-attribution'
import mongoose from 'mongoose'

// Define coordinator roles array
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

// GET /api/referrals/hierarchy - Get referral hierarchy with performance data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Check permissions
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let targetUserId = userId ? new mongoose.Types.ObjectId(userId) : currentUser._id

    // Permission validation
    if (userId && userId !== currentUser._id.toString()) {
      if (currentUser.role === UserRole.ADMIN) {
        // Admins can view anyone's hierarchy
      } else if (coordinatorRoles.includes(currentUser.role as any)) {
        // Coordinators can view their subordinates' hierarchy
        const targetUser = await User.findById(userId)
        if (!targetUser ||
          targetUser.parentCoordinatorId?.toString() !== currentUser._id.toString()) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Validate that user can have a hierarchy
    const targetUser = await User.findById(targetUserId)
    if (!targetUser || (targetUser.role !== UserRole.ADMIN && !coordinatorRoles.includes(targetUser.role as any))) {
      return NextResponse.json({ error: 'User cannot have referral hierarchy' }, { status: 400 })
    }

    // Build hierarchy tree
    const hierarchyTree = await ReferralAttributionService.buildPerformanceHierarchy(
      targetUserId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    if (!hierarchyTree) {
      return NextResponse.json({
        hierarchy: null,
        message: 'No referral code found for user'
      })
    }

    // Get performance metrics for the entire hierarchy
    const performanceMetrics = await ReferralAttributionService.getPerformanceMetrics(
      targetUserId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      true // Include hierarchy
    )

    return NextResponse.json({
      hierarchy: hierarchyTree,
      performance: performanceMetrics,
      rootUser: {
        id: targetUser._id,
        name: targetUser.name,
        role: targetUser.role,
        region: targetUser.region
      }
    })

  } catch (error) {
    console.error('Error fetching referral hierarchy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}