import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * Commission Log Model
 * Tracks commission distribution for each donation across the hierarchy
 */

export interface ICommissionLog extends Document {
  _id: mongoose.Types.ObjectId

  // Reference to donation
  donationId: mongoose.Types.ObjectId

  // User receiving commission
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string

  // Commission details
  commissionAmount: number
  commissionPercentage: number

  // Hierarchy level
  hierarchyLevel: string

  // Payment status
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  paidAt?: Date

  // Transaction reference (if paid)
  transactionId?: string
  paymentMethod?: string

  // Metadata
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Static methods interface
export interface ICommissionLogModel extends Model<ICommissionLog> {
  getCommissionsByUser(userId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<ICommissionLog[]>
  getCommissionsByDonation(donationId: mongoose.Types.ObjectId): Promise<ICommissionLog[]>
  getTotalCommissions(filters?: any): Promise<{ total: number; count: number }>
  getPendingCommissions(userId?: mongoose.Types.ObjectId): Promise<ICommissionLog[]>
}

const commissionLogSchema = new Schema<ICommissionLog>(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation reference is required'],
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },

    userName: {
      type: String,
      required: true
    },

    userRole: {
      type: String,
      required: true
    },

    commissionAmount: {
      type: Number,
      required: [true, 'Commission amount is required'],
      min: [0, 'Commission amount cannot be negative']
    },

    commissionPercentage: {
      type: Number,
      required: [true, 'Commission percentage is required'],
      min: [0, 'Commission percentage cannot be negative'],
      max: [100, 'Commission percentage cannot exceed 100']
    },

    hierarchyLevel: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },

    paidAt: {
      type: Date
    },

    transactionId: {
      type: String
    },

    paymentMethod: {
      type: String
    },

    notes: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes for efficient queries
commissionLogSchema.index({ userId: 1, status: 1, createdAt: -1 })
commissionLogSchema.index({ donationId: 1, userId: 1 })
commissionLogSchema.index({ status: 1, createdAt: -1 })

// Static Methods

/**
 * Get all commissions for a specific user
 */
commissionLogSchema.statics.getCommissionsByUser = async function (
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<ICommissionLog[]> {
  const query: any = { userId }

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = startDate
    if (endDate) query.createdAt.$lte = endDate
  }

  return this.find(query)
    .populate('donationId', 'amount donorName createdAt')
    .sort({ createdAt: -1 })
}

/**
 * Get all commission distributions for a donation
 */
commissionLogSchema.statics.getCommissionsByDonation = async function (
  donationId: mongoose.Types.ObjectId
): Promise<ICommissionLog[]> {
  return this.find({ donationId })
    .populate('userId', 'name email role')
    .sort({ commissionAmount: -1 })
}

/**
 * Get total commissions with filters
 */
commissionLogSchema.statics.getTotalCommissions = async function (
  filters: any = {}
): Promise<{ total: number; count: number }> {
  const result = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 }
      }
    }
  ])

  return result[0] || { total: 0, count: 0 }
}

/**
 * Get pending commissions for a user or all users
 */
commissionLogSchema.statics.getPendingCommissions = async function (
  userId?: mongoose.Types.ObjectId
): Promise<ICommissionLog[]> {
  const query: any = { status: 'PENDING' }
  if (userId) query.userId = userId

  return this.find(query)
    .populate('userId', 'name email role')
    .populate('donationId', 'amount donorName createdAt')
    .sort({ createdAt: -1 })
}

// Export model
const CommissionLog = (mongoose.models.CommissionLog ||
  mongoose.model<ICommissionLog, ICommissionLogModel>('CommissionLog', commissionLogSchema)) as ICommissionLogModel

export default CommissionLog
export { CommissionLog }
