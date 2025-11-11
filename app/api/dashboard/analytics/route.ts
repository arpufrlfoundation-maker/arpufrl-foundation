/**
 * Analytics API
 * Provides performance metrics, graphs, and reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { getAllSubordinates } from '@/lib/hierarchy-utils'
import { Donation } from '@/models/Donation'
import { User } from '@/models/User'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/analytics
 * Fetch analytics data for the current user
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30' // days
    const type = searchParams.get('type') || 'donations' // donations, members, performance

    const userId = session.user.id
    const subordinates = await getAllSubordinates(userId, true)
    const allUserIds = [userId, ...subordinates.map(s => s._id.toString())]

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    if (type === 'donations') {
      // Donation analytics
      const donations = await Donation.find({
        attributedToUserId: { $in: allUserIds },
        paymentStatus: 'SUCCESS',
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: 1 })

      // Group by date
      const dailyStats: { [key: string]: { count: number; amount: number } } = {}
      donations.forEach(d => {
        const date = d.createdAt.toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { count: 0, amount: 0 }
        }
        dailyStats[date].count++
        dailyStats[date].amount += d.amount
      })

      const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        donations: stats.count,
        amount: stats.amount
      }))

      return NextResponse.json({
        success: true,
        data: {
          type: 'donations',
          period: parseInt(period),
          summary: {
            totalDonations: donations.length,
            totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
            averageAmount: donations.length > 0
              ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length
              : 0
          },
          chartData
        }
      })
    }

    if (type === 'members') {
      // Member growth analytics
      const members = await User.find({
        _id: { $in: allUserIds },
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: 1 })

      // Group by date
      const dailyStats: { [key: string]: number } = {}
      members.forEach(m => {
        const date = m.createdAt.toISOString().split('T')[0]
        dailyStats[date] = (dailyStats[date] || 0) + 1
      })

      const chartData = Object.entries(dailyStats).map(([date, count]) => ({
        date,
        members: count
      }))

      return NextResponse.json({
        success: true,
        data: {
          type: 'members',
          period: parseInt(period),
          summary: {
            newMembers: members.length,
            totalMembers: allUserIds.length
          },
          chartData
        }
      })
    }

    if (type === 'performance') {
      // Performance analytics
      const donations = await Donation.find({
        referredBy: { $in: allUserIds },
        paymentStatus: 'SUCCESS',
        createdAt: { $gte: startDate, $lte: endDate }
      })

      const members = await User.find({
        _id: { $in: allUserIds }
      })

      // Calculate performance by role
      const rolePerformance: { [key: string]: { members: number; donations: number; amount: number } } = {}

      members.forEach(m => {
        if (!rolePerformance[m.role]) {
          rolePerformance[m.role] = { members: 0, donations: 0, amount: 0 }
        }
        rolePerformance[m.role].members++
      })

      donations.forEach(d => {
        const member = members.find(m => m._id.toString() === d.attributedToUserId?.toString())
        if (member) {
          rolePerformance[member.role].donations++
          rolePerformance[member.role].amount += d.amount
        }
      })

      const chartData = Object.entries(rolePerformance).map(([role, stats]) => ({
        role,
        ...stats
      }))

      return NextResponse.json({
        success: true,
        data: {
          type: 'performance',
          period: parseInt(period),
          chartData
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid analytics type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
