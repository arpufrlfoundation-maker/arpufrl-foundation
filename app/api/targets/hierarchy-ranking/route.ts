import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target, { TargetStatus } from '@/models/Target'
import { User, RoleHierarchy } from '@/models/User'

/**
 * GET /api/targets/hierarchy-ranking
 * Get ranking of users in the same hierarchy level based on collection performance
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

    // Get current user
    let currentUser
    let currentUserId = session.user.id

    if (session.user.id === 'demo-admin') {
      return NextResponse.json({
        ranking: [],
        currentUserRank: null,
        message: 'Ranking not available for admin'
      })
    }

    currentUser = await User.findById(currentUserId)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentRole = currentUser.role
    const currentLevel = RoleHierarchy[currentRole as keyof typeof RoleHierarchy] || 99

    // Find all users with the same role (same hierarchy level)
    const peersQuery: any = { role: currentRole, status: 'ACTIVE' }

    // If user has regional assignment, filter by region
    if (currentUser.state) {
      peersQuery.state = currentUser.state
    }
    if (currentUser.zone && currentRole.includes('ZONE')) {
      peersQuery.zone = currentUser.zone
    }
    if (currentUser.district && currentRole.includes('DISTRICT')) {
      peersQuery.district = currentUser.district
    }

    const peers = await User.find(peersQuery)
      .select('_id name email role state zone district block')
      .limit(500)

    const peerIds = peers.map(p => p._id)

    // Get active targets for all peers
    const targets = await Target.find({
      assignedTo: { $in: peerIds },
      status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS, TargetStatus.COMPLETED] }
    }).select('assignedTo targetAmount personalCollection teamCollection status')

    // Build ranking data
    const rankingData = peers.map(peer => {
      const peerTarget = targets.find(
        t => t.assignedTo.toString() === peer._id.toString()
      )

      const personalCollection = peerTarget?.personalCollection || 0
      const teamCollection = peerTarget?.teamCollection || 0
      const totalCollection = personalCollection + teamCollection
      const targetAmount = peerTarget?.targetAmount || 0
      const achievementPercentage = targetAmount > 0
        ? (totalCollection / targetAmount) * 100
        : 0

      return {
        userId: peer._id.toString(),
        name: peer.name,
        email: peer.email,
        role: peer.role,
        region: {
          state: peer.state,
          zone: peer.zone,
          district: peer.district,
          block: peer.block
        },
        targetAmount,
        personalCollection,
        teamCollection,
        totalCollection,
        achievementPercentage: Math.round(achievementPercentage * 100) / 100,
        status: peerTarget?.status || 'NO_TARGET'
      }
    })

    // Sort by total collection (descending)
    rankingData.sort((a, b) => {
      // Primary sort: total collection
      if (b.totalCollection !== a.totalCollection) {
        return b.totalCollection - a.totalCollection
      }
      // Secondary sort: achievement percentage
      return b.achievementPercentage - a.achievementPercentage
    })

    // Add rank numbers
    const ranking = rankingData.map((item, index) => ({
      rank: index + 1,
      ...item
    }))

    // Find current user's rank
    const currentUserRank = ranking.findIndex(
      r => r.userId === currentUserId
    ) + 1

    return NextResponse.json({
      success: true,
      ranking,
      currentUserRank: currentUserRank > 0 ? currentUserRank : null,
      totalParticipants: ranking.length,
      currentUser: {
        userId: currentUserId,
        name: currentUser.name,
        role: currentUser.role
      }
    })

  } catch (error: any) {
    console.error('Error fetching hierarchy ranking:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
