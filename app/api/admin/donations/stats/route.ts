import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { UserRole } from '../../../../../models/User'
import { Donation } from '../../../../../models/Donation'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get overall donation statistics
    const [
      totalStats,
      thisMonthStats,
      lastMonthStats
    ] = await Promise.all([
      Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]),
      Donation.aggregate([
        {
          $match: {
            paymentStatus: 'SUCCESS',
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Donation.aggregate([
        {
          $match: {
            paymentStatus: 'SUCCESS',
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
          }
        },
        {
          $group: {
            _id: null,
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Calculate statistics
    const total = totalStats[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 }
    const thisMonth = thisMonthStats[0] || { amount: 0, count: 0 }
    const lastMonth = lastMonthStats[0] || { amount: 0, count: 0 }

    // Calculate monthly growth
    const monthlyGrowth = lastMonth.amount > 0
      ? ((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100
      : 0

    const stats = {
      totalAmount: total.totalAmount,
      totalCount: total.totalCount,
      averageAmount: Math.round(total.averageAmount || 0),
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Donation stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donation statistics' },
      { status: 500 }
    )
  }
}