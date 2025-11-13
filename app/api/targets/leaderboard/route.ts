import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Target, TargetType, TargetStatus } from '@/models/Target'
import { User } from '@/models/User'

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
    const scope = searchParams.get('scope') || 'team' // 'team' | 'region' | 'national'
    const regionType = searchParams.get('regionType') // 'state' | 'zone' | 'district' | 'block'
    const regionValue = searchParams.get('regionValue')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectToDatabase()

    // Get current user - handle demo-admin case
    let user = null
    if (session.user.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(session.user.id)
    }

    // For demo admin or if user not found, skip user validation
    if (!user && !session.user.id.includes('demo')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let query: any = {
      type: TargetType.DONATION_AMOUNT,
      status: { $in: [TargetStatus.IN_PROGRESS, TargetStatus.COMPLETED] }
    }

    // Build query based on scope
    if (scope === 'team' && user) {
      // Get user's team members (users who have this user as parent coordinator)
      const teamMembers = await User.find({ parentCoordinatorId: session.user.id }).select('_id')
      const teamMemberIds = teamMembers.map(member => member._id)

      query.assignedTo = { $in: teamMemberIds }
    } else if (scope === 'region' && regionType && regionValue) {
      // Get by region
      query[`region.${regionType}`] = regionValue
    }
    // For 'national' or admin users, no additional filter needed - show all

    // Get all targets matching criteria
    const targets = await Target.find(query)
      .populate('assignedTo', 'name email role')
      .lean()

    // Calculate leaderboard
    const leaderboard = targets
      .map(target => {
        const totalCollected = target.collectedAmount + target.teamCollectedAmount
        const achievementPercentage = target.targetValue > 0
          ? (totalCollected / target.targetValue) * 100
          : 0

        return {
          userId: (target.assignedTo as any)._id,
          name: (target.assignedTo as any).name,
          email: (target.assignedTo as any).email,
          role: (target.assignedTo as any).role,
          targetAmount: target.targetValue,
          collectedAmount: target.collectedAmount,
          teamCollectedAmount: target.teamCollectedAmount,
          totalCollected,
          achievementPercentage,
          level: target.level,
          region: target.region,
          rank: 0 // Will be set after sorting
        }
      })
      .sort((a, b) => b.totalCollected - a.totalCollected)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

    // Calculate overall statistics
    const overallStats = {
      totalParticipants: targets.length,
      totalTargetAmount: targets.reduce((sum, t) => sum + t.targetValue, 0),
      totalCollected: targets.reduce((sum, t) => sum + t.collectedAmount + t.teamCollectedAmount, 0),
      averageAchievement: targets.length > 0
        ? targets.reduce((sum, t) => {
            const collected = t.collectedAmount + t.teamCollectedAmount
            return sum + (t.targetValue > 0 ? (collected / t.targetValue) * 100 : 0)
          }, 0) / targets.length
        : 0,
      targetsCompleted: targets.filter(t => t.status === TargetStatus.COMPLETED).length
    }

    return NextResponse.json({
      leaderboard,
      stats: overallStats,
      scope,
      region: regionType && regionValue ? {
        type: regionType,
        value: regionValue
      } : null
    })
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
