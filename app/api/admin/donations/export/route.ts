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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // Filter parameters (same as main donations API)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const program = searchParams.get('program') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const minAmount = searchParams.get('minAmount') || ''
    const maxAmount = searchParams.get('maxAmount') || ''

    // Build filter query (same logic as main API)
    const filter: any = {}

    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { donorEmail: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) {
      filter.paymentStatus = status
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    if (minAmount || maxAmount) {
      filter.amount = {}
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount)
      }
    }

    if (program && program !== 'general') {
      filter.programId = program
    } else if (program === 'general') {
      filter.programId = { $exists: false }
    }

    // Fetch donations with related data
    const donations = await Donation.aggregate([
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
      { $sort: { createdAt: -1 } },
      {
        $project: {
          donorName: 1,
          donorEmail: 1,
          donorPhone: 1,
          amount: 1,
          currency: 1,
          paymentStatus: 1,
          razorpayOrderId: 1,
          razorpayPaymentId: 1,
          createdAt: 1,
          programName: '$program.name',
          referralCode: '$referralCode.code',
          referralOwner: '$referralOwner.name'
        }
      }
    ])

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Date',
        'Donor Name',
        'Email',
        'Phone',
        'Amount',
        'Currency',
        'Status',
        'Program',
        'Referral Code',
        'Referral Owner',
        'Razorpay Order ID',
        'Razorpay Payment ID'
      ]

      const csvRows = donations.map(donation => [
        new Date(donation.createdAt).toLocaleDateString('en-IN'),
        donation.donorName || '',
        donation.donorEmail || '',
        donation.donorPhone || '',
        donation.amount || 0,
        donation.currency || 'INR',
        donation.paymentStatus || '',
        donation.programName || 'General Fund',
        donation.referralCode || '',
        donation.referralOwner || '',
        donation.razorpayOrderId || '',
        donation.razorpayPaymentId || ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row =>
          row.map(field =>
            typeof field === 'string' && field.includes(',')
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="donations-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })

    } else if (format === 'pdf') {
      // For PDF, we'll return a simple HTML that can be converted to PDF on the client side
      // In a production environment, you might want to use a library like puppeteer or jsPDF

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Donations Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .status-success { color: green; }
            .status-failed { color: red; }
            .status-pending { color: orange; }
          </style>
        </head>
        <body>
          <h1>Donations Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          <p>Total Records: ${donations.length}</p>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Program</th>
                <th>Referral</th>
              </tr>
            </thead>
            <tbody>
              ${donations.map(donation => `
                <tr>
                  <td>${new Date(donation.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>${donation.donorName || ''}</td>
                  <td class="amount">₹${donation.amount?.toLocaleString('en-IN') || 0}</td>
                  <td class="status-${donation.paymentStatus?.toLowerCase()}">${donation.paymentStatus || ''}</td>
                  <td>${donation.programName || 'General Fund'}</td>
                  <td>${donation.referralCode || 'Direct'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="donations-${new Date().toISOString().split('T')[0]}.html"`
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid format specified' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Export donations error:', error)
    return NextResponse.json(
      { error: 'Failed to export donations' },
      { status: 500 }
    )
  }
}