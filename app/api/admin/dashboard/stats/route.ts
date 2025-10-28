import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { User, UserRole, UserStatus } from '../../../../../models/User'
import { Donation } from '../../../../../models/Donation'
import { Program } from '../../../../../models/Program'

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
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get donation statistics
    const [
      totalDonationsResult,
      thisMonthDonations,
      lastMonthDonations,
      recentDonations
    ] = await Promise.all([
      Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
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
      ]),
      Donation.countDocuments({
        paymentStatus: 'SUCCESS',
        createdAt: { $gte: last7Days }
      })
    ])

    // Calculate donation growth
    const totalDonations = totalDonationsResult[0] || { totalAmount: 0, totalCount: 0 }
    const thisMonth = thisMonthDonations[0] || { amount: 0, count: 0 }
    const lastMonth = lastMonthDonations[0] || { amount: 0, count: 0 }

    const donationGrowth = lastMonth.amount > 0
      ? ((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100
      : 0

    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      thisMonthUsers,
      lastMonthUsers,
      recentRegistrations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: UserStatus.ACTIVE }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      User.countDocuments({ createdAt: { $gte: last7Days } })
    ])

    // Calculate user growth
    const userGrowth = lastMonthUsers > 0
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0

    // Get program statistics
    const [
      totalPrograms,
      activePrograms,
      fundedPrograms,
      recentProgramUpdates
    ] = await Promise.all([
      Program.countDocuments(),
      Program.countDocuments({ active: true }),
      Program.countDocuments({
        active: true,
        $expr: { $gte: ['$raisedAmount', '$targetAmount'] }
      }),
      Program.countDocuments({
        updatedAt: { $gte: last7Days },
        createdAt: { $lt: last7Days } // Updated, not created
      })
    ])

    // Get coordinator statistics
    const [
      totalCoordinators,
      activeCoordinators,
      pendingCoordinators
    ] = await Promise.all([
      User.countDocuments({
        role: { $in: [UserRole.COORDINATOR, UserRole.SUB_COORDINATOR] }
      }),
      User.countDocuments({
        role: { $in: [UserRole.COORDINATOR, UserRole.SUB_COORDINATOR] },
        status: UserStatus.ACTIVE
      }),
      User.countDocuments({
        role: { $in: [UserRole.COORDINATOR, UserRole.SUB_COORDINATOR] },
        status: UserStatus.PENDING
      })
    ])

    // Prepare response data
    const stats = {
      totalDonations: {
        amount: totalDonations.totalAmount,
        count: totalDonations.totalCount,
        growth: Math.round(donationGrowth * 100) / 100
      },
      totalUsers: {
        count: totalUsers,
        active: activeUsers,
        growth: Math.round(userGrowth * 100) / 100
      },
      totalPrograms: {
        count: totalPrograms,
        active: activePrograms,
        funded: fundedPrograms
      },
      coordinators: {
        count: totalCoordinators,
        active: activeCoordinators,
        pending: pendingCoordinators
      },
      recentActivity: {
        donations: recentDonations,
        registrations: recentRegistrations,
        programs: recentProgramUpdates
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}