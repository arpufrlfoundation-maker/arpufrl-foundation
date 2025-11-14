import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target from '@/models/Target'
import mongoose from 'mongoose'

/**
 * GET /api/targets/leaderboard
 * Get leaderboard of top performers
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

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Handle demo-admin - get all leaderboard
    if (session.user.id === 'demo-admin') {
      const leaderboard = await Target.find({
        status: { $in: ['IN_PROGRESS', 'COMPLETED'] },
        totalCollection: { $gt: 0 }
      })
        .populate('assignedTo', 'name role state district zone')
        .sort({ totalCollection: -1 })
        .limit(limit)

      const formattedData = leaderboard.map((target: any, index: number) => {
        const assignedUser = target.assignedTo
        return {
          rank: index + 1,
          userId: assignedUser?._id,
          name: assignedUser?.name || 'Unknown',
          role: assignedUser?.role || 'Unknown',
          level: target.level,
          targetAmount: target.targetAmount,
          totalCollection: target.totalCollection,
          achievementPercentage: target.progressPercentage,
          region: {
            state: assignedUser?.state,
            zone: assignedUser?.zone,
            district: assignedUser?.district
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: formattedData
      })
    }

    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Get leaderboard
    const leaderboard = await Target.getLeaderboard(userId, limit)

    return NextResponse.json({
      success: true,
      data: leaderboard
    })

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
