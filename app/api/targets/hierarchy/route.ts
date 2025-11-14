import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target from '@/models/Target'
import mongoose from 'mongoose'

/**
 * GET /api/targets/hierarchy
 * Get hierarchical target statistics and team breakdown
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

    // Handle demo-admin
    if (session.user.id === 'demo-admin') {
      return NextResponse.json(
        { error: 'Demo admin does not have hierarchy stats' },
        { status: 400 }
      )
    }

    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Get hierarchy statistics
    const hierarchyStats = await Target.getHierarchyStats(userId)

    return NextResponse.json({
      success: true,
      data: hierarchyStats
    })

  } catch (error: any) {
    console.error('Error fetching hierarchy stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hierarchy statistics' },
      { status: 500 }
    )
  }
}
