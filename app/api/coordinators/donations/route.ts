import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { exportToCSV } from '@/lib/csv-export'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const exportFormat = searchParams.get('export') // 'csv' or null
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build query - donations referred by this coordinator
    const query: any = {
      referredBy: session.user.id
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    // Add search filter
    if (search) {
      const donorQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      // Note: This is simplified. In production, you'd need to join with User collection
      query['donorId.name'] = { $regex: search, $options: 'i' }
    }

    // If exporting, get all matching donations
    const queryLimit = exportFormat === 'csv' ? 0 : limit
    const querySkip = exportFormat === 'csv' ? 0 : skip

    const donationsQuery = Donation.find(query)
      .populate('donorId', 'name email phone')
      .populate('programId', 'name')
      .populate('referralCodeId', 'code type')
      .sort({ createdAt: -1 })

    if (queryLimit > 0) {
      donationsQuery.skip(querySkip).limit(queryLimit)
    }

    const donations = await donationsQuery.lean()

    // If CSV export requested
    if (exportFormat === 'csv') {
      const csvData = donations.map(donation => ({
        'Donation ID': donation._id.toString(),
        'Donor Name': donation.donorId ? (donation.donorId as any).name : 'Anonymous',
        'Donor Email': donation.donorId ? (donation.donorId as any).email : '',
        'Amount': donation.amount,
        'Program': donation.programId ? (donation.programId as any).name : 'General',
        'Referral Code': donation.referralCodeId ? (donation.referralCodeId as any).code : '',
        'Status': donation.status,
        'Payment Method': donation.paymentMethod || '',
        'Date': new Date(donation.createdAt).toLocaleDateString(),
        'Transaction ID': donation.razorpayOrderId || ''
      }))

      const csv = exportToCSV(csvData)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="coordinator-donations-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Regular JSON response
    const totalCount = await Donation.countDocuments(query)

    // Calculate stats
    const stats = await Donation.aggregate([
      { $match: { referredBy: session.user.id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonations: { $sum: 1 },
          completedDonations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          }
        }
      }
    ])

    const statsData = stats[0] || {
      totalAmount: 0,
      totalDonations: 0,
      completedDonations: 0,
      completedAmount: 0
    }

    return NextResponse.json({
      donations: donations.map(donation => ({
        id: donation._id.toString(),
        donor: donation.donorId ? {
          name: (donation.donorId as any).name,
          email: (donation.donorId as any).email,
          phone: (donation.donorId as any).phone
        } : { name: 'Anonymous', email: '', phone: '' },
        amount: donation.amount,
        program: donation.programId ? {
          name: (donation.programId as any).name
        } : { name: 'General' },
        referralCode: donation.referralCodeId ? {
          code: (donation.referralCodeId as any).code,
          type: (donation.referralCodeId as any).type
        } : null,
        status: donation.status,
        paymentMethod: donation.paymentMethod || 'online',
        date: donation.createdAt,
        transactionId: donation.razorpayOrderId || ''
      })),
      stats: {
        totalAmount: statsData.totalAmount,
        totalDonations: statsData.totalDonations,
        completedDonations: statsData.completedDonations,
        completedAmount: statsData.completedAmount,
        averageDonation: statsData.completedDonations > 0
          ? statsData.completedAmount / statsData.completedDonations
          : 0
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching coordinator donations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
