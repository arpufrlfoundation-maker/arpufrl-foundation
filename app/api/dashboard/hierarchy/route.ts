/**
 * Dashboard Hierarchy Data API
 * Provides hierarchical dashboard data based on user role and permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { getDashboardStats } from '@/lib/hierarchy-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/hierarchy
 * Fetch dashboard statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get dashboard statistics
    const stats = await getDashboardStats(session.user.id)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Dashboard hierarchy API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
