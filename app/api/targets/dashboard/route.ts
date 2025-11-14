import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Target from '@/models/Target'
import mongoose from 'mongoose'

/**
 * GET /api/targets/dashboard
 * Get comprehensive dashboard data for the current user
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
        { error: 'Demo admin does not have target dashboard' },
        { status: 400 }
      )
    }

    // Check if user is ADMIN role
    const { User } = await import('@/models/User')
    const user = await User.findById(session.user.id).select('role')

    if (user && user.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        message: 'Admins do not have personal targets. Use hierarchy view to see team performance.'
      })
    }

    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Get comprehensive dashboard data
    const dashboardData = await Target.getDashboardData(userId)

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
