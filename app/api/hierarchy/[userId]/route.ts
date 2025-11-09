import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'

// GET - Fetch hierarchy tree
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectDB()

    const userId = params.userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build hierarchy tree
    const hierarchyTree = await User.getHierarchyTree(new mongoose.Types.ObjectId(userId))

    // Get path to root
    const hierarchyPath = await user.getHierarchyPath()

    // Get direct subordinates with stats
    const subordinates = await User.find({
      parentCoordinatorId: userId,
      status: 'ACTIVE'
    }).select('name email role referralCode totalDonationsReferred totalAmountReferred createdAt')

    // Calculate aggregated stats
    const aggregatedStats = await calculateAggregatedStats(new mongoose.Types.ObjectId(userId))

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        hierarchyLevel: RoleHierarchy[user.role]
      },
      hierarchyTree,
      hierarchyPath: hierarchyPath.map(u => ({
        id: u._id,
        name: u.name,
        role: u.role,
        hierarchyLevel: RoleHierarchy[u.role]
      })),
      subordinates,
      aggregatedStats
    })
  } catch (error) {
    console.error('Error fetching hierarchy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy' },
      { status: 500 }
    )
  }
}

async function calculateAggregatedStats(userId: mongoose.Types.ObjectId) {
  const { Donation } = await import('@/models/Donation')
  const { Target } = await import('@/models/Target')

  // Get all users in the hierarchy
  const allUsers = await getAllSubordinates(userId)
  const allUserIds = [userId, ...allUsers.map(u => u._id)]

  // Get donations for all users in hierarchy
  const donations = await Donation.find({
    attributedToUserId: { $in: allUserIds },
    paymentStatus: 'SUCCESS'
  })

  const totalDonations = donations.length
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

  // Get targets for all users
  const targets = await Target.find({
    assignedTo: { $in: allUserIds }
  })

  const activeTargets = targets.filter(
    t => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
  ).length
  const completedTargets = targets.filter(t => t.status === 'COMPLETED').length

  // Performance by role
  const performanceByRole = await calculatePerformanceByRole(allUserIds)

  return {
    totalMembers: allUserIds.length,
    totalDonations,
    totalAmount,
    averageDonation: totalDonations > 0 ? totalAmount / totalDonations : 0,
    activeTargets,
    completedTargets,
    targetCompletionRate: targets.length > 0 ? (completedTargets / targets.length) * 100 : 0,
    performanceByRole
  }
}

async function getAllSubordinates(userId: mongoose.Types.ObjectId) {
  const subordinates: any[] = []
  const queue = [userId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = await User.find({
      parentCoordinatorId: currentId,
      status: 'ACTIVE'
    })

    for (const child of children) {
      subordinates.push(child)
      queue.push(child._id)
    }
  }

  return subordinates
}

async function calculatePerformanceByRole(userIds: mongoose.Types.ObjectId[]) {
  const { Donation } = await import('@/models/Donation')

  const users = await User.find({
    _id: { $in: userIds }
  }).select('role totalDonationsReferred totalAmountReferred')

  const roleMap = new Map<string, {
    members: number
    totalDonations: number
    totalAmount: number
  }>()

  users.forEach(user => {
    const existing = roleMap.get(user.role) || {
      members: 0,
      totalDonations: 0,
      totalAmount: 0
    }

    roleMap.set(user.role, {
      members: existing.members + 1,
      totalDonations: existing.totalDonations + (user.totalDonationsReferred || 0),
      totalAmount: existing.totalAmount + (user.totalAmountReferred || 0)
    })
  })

  return Array.from(roleMap.entries()).map(([role, stats]) => ({
    role,
    ...stats,
    averageDonationsPerMember: stats.members > 0 ? stats.totalDonations / stats.members : 0,
    averageAmountPerMember: stats.members > 0 ? stats.totalAmount / stats.members : 0
  }))
}
