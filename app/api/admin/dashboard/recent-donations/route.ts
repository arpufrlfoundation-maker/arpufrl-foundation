import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { UserRole } from '../../../../../models/User'
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch recent donations with program information
    const donations = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'SUCCESS'
        }
      },
      {
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: '_id',
          as: 'program'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: offset
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          donorName: 1,
          donorEmail: 1,
          amount: 1,
          createdAt: 1,
          program: { $arrayElemAt: ['$program.name', 0] }
        }
      }
    ])

    // Format the response
    const formattedDonations = donations.map(donation => ({
      id: donation._id.toString(),
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      amount: donation.amount,
      program: donation.program || null,
      createdAt: donation.createdAt.toISOString()
    }))

    return NextResponse.json({
      donations: formattedDonations,
      total: donations.length
    })

  } catch (error) {
    console.error('Recent donations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent donations' },
      { status: 500 }
    )
  }
}