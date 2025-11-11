import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId

  // User and Hierarchy
  userId: mongoose.Types.ObjectId // User who collected the amount
  collectedBy: mongoose.Types.ObjectId // Same as userId (for clarity)
  verifiedBy?: mongoose.Types.ObjectId // Admin/coordinator who verified

  // Amount and Payment
  amount: number
  paymentMode: 'cash' | 'online' | 'cheque' | 'upi' | 'bank_transfer' | 'other'
  transactionId?: string // Payment gateway transaction ID
  receiptNumber?: string // Receipt/invoice number

  // Verification
  status: 'pending' | 'verified' | 'rejected'
  verifiedAt?: Date
  rejectionReason?: string

  // Attribution
  targetId?: mongoose.Types.ObjectId // Associated target
  donationId?: mongoose.Types.ObjectId // Link to donation if applicable
  referralCodeId?: mongoose.Types.ObjectId // If collected via referral

  // Details
  donorName?: string
  donorContact?: string
  donorEmail?: string
  purpose?: string
  notes?: string

  // Proof/Evidence
  attachments?: string[] // URLs to receipts, screenshots, etc.

  // Timestamps
  collectionDate: Date
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least ₹1'],
      max: [10000000, 'Amount is too large']
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'online', 'cheque', 'upi', 'bank_transfer', 'other'],
      required: true,
      index: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    receiptNumber: {
      type: String,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: true,
      index: true
    },
    verifiedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      maxlength: 500
    },
    targetId: {
      type: Schema.Types.ObjectId,
      ref: 'Target',
      index: true
    },
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      index: true
    },
    referralCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'ReferralCode',
      index: true
    },
    donorName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    donorContact: {
      type: String,
      trim: true,
      maxlength: 15
    },
    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 300
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    attachments: [{
      type: String,
      trim: true
    }],
    collectionDate: {
      type: Date,
      required: true,
      index: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
TransactionSchema.index({ userId: 1, status: 1 })
TransactionSchema.index({ collectedBy: 1, collectionDate: -1 })
TransactionSchema.index({ status: 1, createdAt: -1 })
TransactionSchema.index({ verifiedBy: 1, verifiedAt: -1 })

// Pre-save hook to auto-set collectedBy
TransactionSchema.pre('save', function (next) {
  if (!this.collectedBy) {
    this.collectedBy = this.userId
  }
  next()
})

// Post-save hook to propagate collection up the hierarchy
TransactionSchema.post('save', async function (doc) {
  // Only propagate if transaction is verified
  if (doc.status === 'verified' && doc.amount > 0) {
    try {
      const Target = mongoose.model('Target') as any
      if (Target.propagateCollection) {
        await Target.propagateCollection(doc.userId, doc.amount)
      }
    } catch (error) {
      console.error('Error propagating collection:', error)
    }
  }
})

// Instance method to verify transaction
TransactionSchema.methods.verify = async function (
  verifiedBy: mongoose.Types.ObjectId
): Promise<ITransaction> {
  this.status = 'verified'
  this.verifiedBy = verifiedBy
  this.verifiedAt = new Date()
  return await this.save()
}

// Instance method to reject transaction
TransactionSchema.methods.reject = async function (
  verifiedBy: mongoose.Types.ObjectId,
  reason: string
): Promise<ITransaction> {
  this.status = 'rejected'
  this.verifiedBy = verifiedBy
  this.verifiedAt = new Date()
  this.rejectionReason = reason
  return await this.save()
}

// Static method to get user's transactions
TransactionSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  options?: { status?: string; startDate?: Date; endDate?: Date }
) {
  const query: any = { userId }

  if (options?.status) {
    query.status = options.status
  }

  if (options?.startDate || options?.endDate) {
    query.collectionDate = {}
    if (options.startDate) {
      query.collectionDate.$gte = options.startDate
    }
    if (options.endDate) {
      query.collectionDate.$lte = options.endDate
    }
  }

  return this.find(query)
    .populate('verifiedBy', 'name email')
    .sort({ collectionDate: -1 })
}

// Static method to get pending transactions
TransactionSchema.statics.findPending = function (limit = 50) {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email role')
    .populate('collectedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Static method to calculate total verified amount for a user
TransactionSchema.statics.getTotalVerified = async function (
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const query: any = {
    userId,
    status: 'verified'
  }

  if (startDate || endDate) {
    query.collectionDate = {}
    if (startDate) {
      query.collectionDate.$gte = startDate
    }
    if (endDate) {
      query.collectionDate.$lte = endDate
    }
  }

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ])

  return result.length > 0 ? result[0].total : 0
}

// Prevent model recompilation in development
const Transaction = (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction
