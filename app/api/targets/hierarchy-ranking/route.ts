import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, RoleHierarchy } from '@/models/User'
import { Target } from '@/models/Target'
import mongoose from 'mongoose'

/**
 * GET /api/targets/hierarchy-ranking
 * Get ranking of users at the same hierarchy level
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get current user
    const currentUser = await User.findById(session.user.id)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get hierarchy level of current user
    const currentLevel = RoleHierarchy[currentUser.role as keyof typeof RoleHierarchy]

    // Find all users at the same hierarchy level
    const peersRoles = Object.entries(RoleHierarchy)
      .filter(([_, level]) => level === currentLevel)
      .map(([role]) => role)

    // Get all peers (users with same hierarchy level)
    const peers = await User.find({
      role: { $in: peersRoles },
      status: 'ACTIVE'
    }).select('_id name email role').lean()

    const peerIds = peers.map(p => p._id)

    // Get targets and performance for all peers
    const targetStats = await Target.aggregate([
      {
        $match: {
          assignedToId: { $in: peerIds }
        }
      },
      {
        $group: {
          _id: '$assignedToId',
          totalTarget: { $sum: '$targetAmount' },
          totalCollected: { $sum: '$collectedAmount' },
          activeTargets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ])

    // Create a map of user performance
    const performanceMap = new Map(
      targetStats.map(stat => [
        stat._id.toString(),
        {
          totalTarget: stat.totalTarget,
          totalCollected: stat.totalCollected,
          activeTargets: stat.activeTargets,
          achievementPercentage:
            stat.totalTarget > 0 ? (stat.totalCollected / stat.totalTarget) * 100 : 0
        }
      ])
    )

    // Build ranking data
    const rankingData = peers.map(peer => ({
      userId: peer._id.toString(),
      name: peer.name,
      email: peer.email,
      role: peer.role,
      totalCollected: performanceMap.get(peer._id.toString())?.totalCollected || 0,
      totalTarget: performanceMap.get(peer._id.toString())?.totalTarget || 0,
      achievementPercentage:
        performanceMap.get(peer._id.toString())?.achievementPercentage || 0,
      isCurrentUser: peer._id.toString() === session.user.id
    }))

    // Sort by total collected (descending)
    rankingData.sort((a, b) => b.totalCollected - a.totalCollected)

    // Assign ranks
    const ranking = rankingData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    // Find current user's rank
    const currentUserRank =
      ranking.find(entry => entry.isCurrentUser)?.rank || null

    return NextResponse.json({
      ranking,
      currentUserRank,
      hierarchyLevel: currentLevel,
      totalPeers: peers.length
    })
  } catch (error: any) {
    console.error('Error fetching hierarchy ranking:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
