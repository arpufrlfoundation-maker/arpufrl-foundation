import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Donation } from '@/models/Donation'
import { Target } from '@/models/Target'
import { generateQRCodeDataURL } from '@/lib/referral-utils'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectToDatabase()

    const { userId } = await params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Fetch user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch donations attributed to this user
    const donations = await Donation.find({
      attributedToUserId: userId,
      paymentStatus: 'SUCCESS'
    }).sort({ createdAt: -1 })

    // Fetch targets
    const targets = await Target.find({
      assignedTo: userId
    }).sort({ createdAt: -1 })

    // Calculate stats
    const totalDonations = donations.length
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
    const activeTargets = targets.filter(
      t => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
    ).length
    const completedTargets = targets.filter(t => t.status === 'COMPLETED').length

    // Get direct subordinates
    const directSubordinates = await User.countDocuments({
      parentCoordinatorId: userId,
      status: 'ACTIVE'
    })

    // Get total in hierarchy (recursive count)
    const totalInHierarchy = await getTotalHierarchyCount(new mongoose.Types.ObjectId(userId))

    // Calculate donation trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const donationTrend = await calculateDonationTrend(
      new mongoose.Types.ObjectId(userId),
      thirtyDaysAgo
    )

    // Calculate target progress
    const targetProgress = targets
      .filter(t => t.status !== 'CANCELLED')
      .slice(0, 5)
      .map(t => ({
        name: t.type.replace(/_/g, ' '),
        target: t.targetValue,
        current: t.currentValue,
        percentage: t.progressPercentage
      }))

    // Calculate referral distribution (by day of week or source)
    const referralDistribution = calculateReferralDistribution(donations)

    // Generate QR code
    let qrCodeUrl = undefined
    if (user.referralCode) {
      qrCodeUrl = await generateQRCodeDataURL(
        user.referralCode,
        process.env.NEXT_PUBLIC_BASE_URL || ''
      )
    }

    return NextResponse.json({
      stats: {
        totalDonations,
        totalAmount,
        activeTargets,
        completedTargets,
        directSubordinates,
        totalInHierarchy
      },
      donationTrend,
      targetProgress,
      referralDistribution,
      recentDonations: donations.slice(0, 20),
      targets,
      qrCodeUrl
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

async function getTotalHierarchyCount(userId: mongoose.Types.ObjectId): Promise<number> {
  let count = 0
  const queue = [userId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const subordinates = await User.find({
      parentCoordinatorId: currentId,
      status: 'ACTIVE'
    })

    count += subordinates.length
    subordinates.forEach(sub => queue.push(sub._id))
  }

  return count
}

async function calculateDonationTrend(
  userId: mongoose.Types.ObjectId,
  startDate: Date
): Promise<Array<{ date: string; amount: number; count: number }>> {
  const donations = await Donation.find({
    attributedToUserId: userId,
    paymentStatus: 'SUCCESS',
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 })

  // Group by date
  const trendMap = new Map<string, { amount: number; count: number }>()

  donations.forEach(donation => {
    const date = donation.createdAt.toISOString().split('T')[0]
    const existing = trendMap.get(date) || { amount: 0, count: 0 }
    trendMap.set(date, {
      amount: existing.amount + donation.amount,
      count: existing.count + 1
    })
  })

  return Array.from(trendMap.entries()).map(([date, data]) => ({
    date,
    ...data
  }))
}

function calculateReferralDistribution(
  donations: any[]
): Array<{ name: string; value: number }> {
  if (donations.length === 0) {
    return [{ name: 'No Data', value: 1 }]
  }

  // Group by day of week
  const dayMap = new Map<string, number>()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  donations.forEach(donation => {
    const day = days[new Date(donation.createdAt).getDay()]
    dayMap.set(day, (dayMap.get(day) || 0) + 1)
  })

  return Array.from(dayMap.entries()).map(([name, value]) => ({
    name,
    value
  }))
}
