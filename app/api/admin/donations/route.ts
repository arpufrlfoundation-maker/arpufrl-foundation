import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { connectToDatabase } from '../../../../lib/db'
import { User, UserRole } from '../../../../models/User'
import { Donation } from '../../../../models/Donation'
import { Program } from '../../../../models/Program'
import { ReferralCode } from '../../../../models/ReferralCode'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filter parameters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const program = searchParams.get('program') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const minAmount = searchParams.get('minAmount') || ''
    const maxAmount = searchParams.get('maxAmount') || ''

    // Build filter query
    const filter: any = {}

    // Search filter
    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { donorEmail: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } }
      ]
    }

    // Status filter
    if (status) {
      filter.paymentStatus = status
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {}
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount)
      }
    }

    // Program filter
    if (program && program !== 'general') {
      filter.programId = program
    } else if (program === 'general') {
      filter.programId = { $exists: false }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: '_id',
          as: 'program'
        }
      },
      {
        $lookup: {
          from: 'referralcodes',
          localField: 'referralCodeId',
          foreignField: '_id',
          as: 'referralCode'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referralCode.ownerUserId',
          foreignField: '_id',
          as: 'referralOwner'
        }
      },
      {
        $addFields: {
          program: { $arrayElemAt: ['$program', 0] },
          referralCode: { $arrayElemAt: ['$referralCode', 0] },
          referralOwner: { $arrayElemAt: ['$referralOwner', 0] }
        }
      },
      { $sort: sort },
      {
        $facet: {
          donations: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                donorName: 1,
                donorEmail: 1,
                donorPhone: 1,
                amount: 1,
                currency: 1,
                paymentStatus: 1,
                razorpayOrderId: 1,
                razorpayPaymentId: 1,
                createdAt: 1,
                updatedAt: 1,
                program: {
                  id: '$program._id',
                  name: '$program.name'
                },
                referralCode: {
                  $cond: {
                    if: { $ne: ['$referralCode', null] },
                    then: {
                      code: '$referralCode.code',
                      ownerName: '$referralOwner.name'
                    },
                    else: null
                  }
                }
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ]

    const [result] = await Donation.aggregate(pipeline)
    const donations = result.donations || []
    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Format response
    const formattedDonations = donations.map((donation: any) => ({
      id: donation._id.toString(),
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorPhone: donation.donorPhone,
      amount: donation.amount,
      currency: donation.currency,
      paymentStatus: donation.paymentStatus,
      razorpayOrderId: donation.razorpayOrderId,
      razorpayPaymentId: donation.razorpayPaymentId,
      program: donation.program,
      referralCode: donation.referralCode,
      createdAt: donation.createdAt.toISOString(),
      updatedAt: donation.updatedAt.toISOString()
    }))

    return NextResponse.json({
      donations: formattedDonations,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Donations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}