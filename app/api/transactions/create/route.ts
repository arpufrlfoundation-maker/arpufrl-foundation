import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Transaction from '@/models/Transaction'
import Target, { TargetStatus } from '@/models/Target'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      amount,
      paymentMode,
      transactionId,
      receiptNumber,
      donorName,
      donorContact,
      donorEmail,
      purpose,
      notes,
      collectionDate,
      attachments
    } = body

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!paymentMode) {
      return NextResponse.json(
        { error: 'Payment mode is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find user's active target - handle demo-admin case
    let activeTarget = null
    if (session.user.id.match(/^[0-9a-fA-F]{24}$/)) {
      activeTarget = await Target.findOne({
        assignedTo: session.user.id,
        status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
      })
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: session.user.id,
      collectedBy: session.user.id,
      amount,
      paymentMode,
      transactionId: transactionId || undefined,
      receiptNumber: receiptNumber || undefined,
      status: 'pending', // Will be verified by admin/coordinator
      targetId: activeTarget ? activeTarget._id : undefined,
      donorName: donorName || undefined,
      donorContact: donorContact || undefined,
      donorEmail: donorEmail || undefined,
      purpose: purpose || undefined,
      notes: notes || undefined,
      attachments: attachments || [],
      collectionDate: collectionDate ? new Date(collectionDate) : new Date()
    })

    await transaction.populate('userId', 'name email role')

    return NextResponse.json({
      success: true,
      message: 'Transaction recorded successfully. Awaiting verification.',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        paymentMode: transaction.paymentMode,
        status: transaction.status,
        collectionDate: transaction.collectionDate,
        receiptNumber: transaction.receiptNumber,
        donorName: transaction.donorName,
        purpose: transaction.purpose,
        notes: transaction.notes,
        createdAt: transaction.createdAt
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error recording transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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
    const userId = searchParams.get('userId') || session.user.id
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build query
    const query: any = { userId }

    if (status) {
      query.status = status
    }

    if (startDate || endDate) {
      query.collectionDate = {}
      if (startDate) {
        query.collectionDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.collectionDate.$lte = new Date(endDate)
      }
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .populate('userId', 'name email role')
      .populate('verifiedBy', 'name email')
      .sort({ collectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await Transaction.countDocuments(query)

    // Calculate statistics
    const stats = await Transaction.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    const statsMap: any = {
      pending: { count: 0, amount: 0 },
      verified: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 }
    }

    stats.forEach(stat => {
      statsMap[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      }
    })

    return NextResponse.json({
      transactions: transactions.map(txn => ({
        id: txn._id.toString(),
        user: txn.userId ? {
          name: (txn.userId as any).name,
          email: (txn.userId as any).email
        } : null,
        amount: txn.amount,
        paymentMode: txn.paymentMode,
        transactionId: txn.transactionId,
        receiptNumber: txn.receiptNumber,
        status: txn.status,
        verifiedBy: txn.verifiedBy ? {
          name: (txn.verifiedBy as any).name,
          email: (txn.verifiedBy as any).email
        } : null,
        verifiedAt: txn.verifiedAt,
        rejectionReason: txn.rejectionReason,
        donorName: txn.donorName,
        donorContact: txn.donorContact,
        donorEmail: txn.donorEmail,
        purpose: txn.purpose,
        notes: txn.notes,
        attachments: txn.attachments,
        collectionDate: txn.collectionDate,
        createdAt: txn.createdAt
      })),
      stats: statsMap,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
