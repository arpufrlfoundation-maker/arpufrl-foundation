import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { UserRole } from '../../../../../models/User'
import { Program } from '../../../../../models/Program'
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

    // Get program statistics
    const [
      totalPrograms,
      activePrograms,
      featuredPrograms,
      programStats,
      donationStats
    ] = await Promise.all([
      Program.countDocuments(),
      Program.countDocuments({ active: true }),
      Program.countDocuments({ featured: true }),
      Program.aggregate([
        {
          $group: {
            _id: null,
            totalTargetAmount: {
              $sum: {
                $cond: {
                  if: { $ne: ['$targetAmount', null] },
                  then: '$targetAmount',
                  else: 0
                }
              }
            },
            totalRaisedAmount: { $sum: '$raisedAmount' },
            totalDonations: { $sum: '$donationCount' },
            programsWithTargets: {
              $sum: {
                $cond: {
                  if: { $ne: ['$targetAmount', null] },
                  then: 1,
                  else: 0
                }
              }
            },
            averageFundingPercentage: {
              $avg: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$targetAmount', null] },
                      { $gt: ['$targetAmount', 0] }
                    ]
                  },
                  then: {
                    $multiply: [
                      { $divide: ['$raisedAmount', '$targetAmount'] },
                      100
                    ]
                  },
                  else: 0
                }
              }
            }
          }
        }
      ]),
      // Get total donations across all programs
      Donation.aggregate([
        {
          $match: {
            paymentStatus: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ])

    const programStatsData = programStats[0] || {
      totalTargetAmount: 0,
      totalRaisedAmount: 0,
      totalDonations: 0,
      programsWithTargets: 0,
      averageFundingPercentage: 0
    }

    const donationStatsData = donationStats[0] || {
      totalDonations: 0,
      totalAmount: 0
    }

    const stats = {
      totalPrograms,
      activePrograms,
      featuredPrograms,
      totalTargetAmount: programStatsData.totalTargetAmount,
      totalRaisedAmount: programStatsData.totalRaisedAmount,
      totalDonations: donationStatsData.totalDonations, // Use actual donation count from donations collection
      averageFundingPercentage: programStatsData.averageFundingPercentage || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Program stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program statistics' },
      { status: 500 }
    )
  }
}