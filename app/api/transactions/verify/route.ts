import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Transaction from '@/models/Transaction'
import { User, UserRole } from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission (admin or coordinator)
    let user = null
    if (session.user.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(session.user.id)
      if (!user || ![UserRole.ADMIN, 'COORDINATOR'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Only admins and coordinators can verify transactions' },
          { status: 403 }
        )
      }
    } else {
      // Demo admin
      user = { role: UserRole.ADMIN, _id: session.user.id }
    }

    const body = await request.json()
    const { transactionId, action, reason } = body

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find the transaction
    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if already verified or rejected
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: `Transaction already ${transaction.status}` },
        { status: 409 }
      )
    }

    // For coordinators, verify they can only verify their team's transactions
    if (user.role !== UserRole.ADMIN) {
      const transactionUser = await User.findById(transaction.userId)
      if (!transactionUser) {
        return NextResponse.json(
          { error: 'Transaction user not found' },
          { status: 404 }
        )
      }

      // Check if transaction user is under this coordinator's hierarchy
      if (transactionUser.parentCoordinatorId?.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only verify transactions from your team members' },
          { status: 403 }
        )
      }
    }

    // Perform verification or rejection
    if (action === 'approve') {
      await (transaction as any).verify(session.user.id)
    } else {
      await (transaction as any).reject(session.user.id, reason)
    }

    await transaction.populate('userId', 'name email')
    await transaction.populate('verifiedBy', 'name email')

    return NextResponse.json({
      success: true,
      message: `Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        user: {
          name: (transaction.userId as any).name,
          email: (transaction.userId as any).email
        },
        verifiedBy: {
          name: (transaction.verifiedBy as any).name,
          email: (transaction.verifiedBy as any).email
        },
        verifiedAt: transaction.verifiedAt,
        rejectionReason: transaction.rejectionReason
      }
    })
  } catch (error: any) {
    console.error('Error verifying transaction:', error)
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

    // Check if user has permission
    let user: any = null
    if (session.user.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(session.user.id)
      if (!user || ![UserRole.ADMIN, 'COORDINATOR'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Only admins and coordinators can view pending transactions' },
          { status: 403 }
        )
      }
    } else {
      // Demo admin
      user = { role: UserRole.ADMIN, _id: session.user.id }
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const statusFilter = searchParams.get('status')

    await connectToDatabase()

    let query: any = {}

    // Add status filter if provided
    if (statusFilter && ['pending', 'verified', 'rejected'].includes(statusFilter)) {
      query.status = statusFilter
    }

    // For coordinators, only show their team's transactions
    if (user.role !== UserRole.ADMIN) {
      // Get team members (users who have this user as parent coordinator)
      const teamMembers = await User.find({ parentCoordinatorId: session.user.id }).select('_id')
      const teamMemberIds = teamMembers.map(member => member._id)

      query.userId = { $in: teamMemberIds }
    }

    const pendingTransactions = await Transaction.find(query)
      .populate('userId', 'name email role')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      transactions: pendingTransactions.map(txn => ({
        id: txn._id.toString(),
        user: {
          id: (txn.userId as any)._id,
          name: (txn.userId as any).name,
          email: (txn.userId as any).email,
          role: (txn.userId as any).role
        },
        amount: txn.amount,
        paymentMode: txn.paymentMode,
        transactionId: txn.transactionId,
        receiptNumber: txn.receiptNumber,
        status: txn.status,
        donorName: txn.donorName,
        donorContact: txn.donorContact,
        donorEmail: txn.donorEmail,
        purpose: txn.purpose,
        notes: txn.notes,
        attachments: txn.attachments,
        collectionDate: txn.collectionDate,
        createdAt: txn.createdAt,
        verifiedBy: txn.verifiedBy ? {
          name: (txn.verifiedBy as any)?.name,
          email: (txn.verifiedBy as any)?.email
        } : null,
        verifiedAt: txn.verifiedAt,
        rejectionReason: txn.rejectionReason
      })),
      count: pendingTransactions.length
    })
  } catch (error: any) {
    console.error('Error fetching pending transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
