import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'

// Payment status enum
export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus]

// Currency enum (supporting multiple currencies for future expansion)
export const Currency = {
  INR: 'INR',
  USD: 'USD'
} as const

export type CurrencyType = typeof Currency[keyof typeof Currency]

// Zod validation schemas
export const donationValidationSchema = z.object({
  donorName: z.string()
    .min(2, 'Donor name must be at least 2 characters')
    .max(100, 'Donor name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Donor name can only contain letters and spaces'),

  donorEmail: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase())
    .optional(),

  donorPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional(),

  amount: z.number()
    .min(100, 'Minimum donation amount is ₹100')
    .max(100000, 'Maximum donation amount is ₹100,000')
    .int('Amount must be a whole number'),

  currency: z.enum([Currency.INR, Currency.USD]).default(Currency.INR),

  programId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid program ID format')
    .optional(),

  referralCode: z.string()
    .min(3, 'Referral code must be at least 3 characters')
    .max(50, 'Referral code must not exceed 50 characters')
    .optional(),

  paymentStatus: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED
  ]).default(PaymentStatus.PENDING),

  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),

  razorpayPaymentId: z.string().optional(),

  razorpaySignature: z.string().optional()
})

export const donationCreationSchema = donationValidationSchema.pick({
  donorName: true,
  donorEmail: true,
  donorPhone: true,
  amount: true,
  currency: true,
  programId: true,
  referralCode: true
})

// TypeScript interface for Donation document
export interface IDonation extends Document {
  _id: mongoose.Types.ObjectId
  donorName: string
  donorEmail?: string
  donorPhone?: string
  amount: number
  currency: CurrencyType
  programId?: mongoose.Types.ObjectId

  // Payment tracking
  paymentStatus: PaymentStatusType
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string

  // Referral tracking
  referralCodeId?: mongoose.Types.ObjectId
  attributedToUserId?: mongoose.Types.ObjectId

  // Metadata
  ipAddress?: string
  userAgent?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  markAsSuccessful(paymentId: string, signature: string): Promise<IDonation>
  markAsFailed(reason?: string): Promise<IDonation>
  calculateFees(): number
  toReceiptData(): DonationReceiptData
}

// Static methods interface
export interface IDonationModel extends Model<IDonation> {
  findByRazorpayOrderId(orderId: string): Promise<IDonation | null>
  findByReferralCode(referralCode: string): Promise<IDonation[]>
  findByProgram(programId: mongoose.Types.ObjectId): Promise<IDonation[]>
  getSuccessfulDonations(): Promise<IDonation[]>
  getTotalAmountByProgram(programId: mongoose.Types.ObjectId): Promise<number>
  getTotalAmountByReferral(userId: mongoose.Types.ObjectId): Promise<number>
  getDonationStats(startDate?: Date, endDate?: Date): Promise<DonationStats>
}

// Helper interfaces
export interface DonationReceiptData {
  donationId: string
  donorName: string
  donorEmail?: string
  amount: number
  currency: string
  programName?: string
  paymentId?: string
  donationDate: Date
}

export interface DonationStats {
  totalAmount: number
  totalCount: number
  successfulCount: number
  failedCount: number
  pendingCount: number
  refundedCount: number
  averageAmount: number
  topPrograms: Array<{
    programId: mongoose.Types.ObjectId
    programName: string
    amount: number
    count: number
  }>
}

// Mongoose schema definition
const donationSchema = new Schema<IDonation>({
  donorName: {
    type: String,
    required: [true, 'Donor name is required'],
    trim: true,
    minlength: [2, 'Donor name must be at least 2 characters'],
    maxlength: [100, 'Donor name must not exceed 100 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Donor name can only contain letters and spaces']
  },

  donorEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    index: true
  },

  donorPhone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Invalid phone number format'],
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number must not exceed 15 digits']
  },

  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [100, 'Minimum donation amount is ₹100'],
    max: [100000, 'Maximum donation amount is ₹100,000'],
    validate: {
      validator: Number.isInteger,
      message: 'Amount must be a whole number'
    },
    index: true
  },

  currency: {
    type: String,
    enum: Object.values(Currency),
    default: Currency.INR,
    required: [true, 'Currency is required']
  },

  programId: {
    type: Schema.Types.ObjectId,
    ref: 'Program',
    index: true
  },

  // Payment tracking
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    required: [true, 'Payment status is required'],
    index: true
  },

  razorpayOrderId: {
    type: String,
    required: [true, 'Razorpay order ID is required'],
    unique: true,
    index: true
  },

  razorpayPaymentId: {
    type: String,
    index: true
  },

  razorpaySignature: {
    type: String
  },

  // Referral tracking
  referralCodeId: {
    type: Schema.Types.ObjectId,
    ref: 'ReferralCode',
    index: true
  },

  attributedToUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Metadata
  ipAddress: {
    type: String,
    validate: {
      validator: function (v: string) {
        if (!v) return true
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
        return ipv4Regex.test(v) || ipv6Regex.test(v)
      },
      message: 'Invalid IP address format'
    }
  },

  userAgent: {
    type: String,
    maxlength: [500, 'User agent must not exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      if ('__v' in ret) delete (ret as any).__v
      return ret
    }
  }
})

// Indexes for performance - commented out for Edge Runtime compatibility
// donationSchema.index({ razorpayOrderId: 1 }, { unique: true })
// donationSchema.index({ paymentStatus: 1, createdAt: -1 })
// donationSchema.index({ programId: 1, paymentStatus: 1 })
// donationSchema.index({ attributedToUserId: 1, paymentStatus: 1 })
// donationSchema.index({ referralCodeId: 1, paymentStatus: 1 })
// donationSchema.index({ createdAt: -1 })
// donationSchema.index({ amount: -1 })

// Instance methods
donationSchema.methods.markAsSuccessful = async function (paymentId: string, signature: string): Promise<IDonation> {
  this.paymentStatus = PaymentStatus.SUCCESS
  this.razorpayPaymentId = paymentId
  this.razorpaySignature = signature
  return await this.save()
}

donationSchema.methods.markAsFailed = async function (reason?: string): Promise<IDonation> {
  this.paymentStatus = PaymentStatus.FAILED
  // Could add a reason field if needed
  return await this.save()
}

donationSchema.methods.calculateFees = function (): number {
  // Razorpay fees calculation (approximate)
  // 2% + GST (18%) = 2.36% total
  const feePercentage = 0.0236
  return Math.round(this.amount * feePercentage)
}

donationSchema.methods.toReceiptData = function (): DonationReceiptData {
  return {
    donationId: this._id.toString(),
    donorName: this.donorName,
    donorEmail: this.donorEmail,
    amount: this.amount,
    currency: this.currency,
    paymentId: this.razorpayPaymentId,
    donationDate: this.createdAt
  }
}

// Static methods
donationSchema.statics.findByRazorpayOrderId = function (orderId: string) {
  return this.findOne({ razorpayOrderId: orderId })
}

donationSchema.statics.findByReferralCode = function (referralCode: string) {
  return this.find({ referralCodeId: referralCode, paymentStatus: PaymentStatus.SUCCESS })
}

donationSchema.statics.findByProgram = function (programId: mongoose.Types.ObjectId) {
  return this.find({ programId, paymentStatus: PaymentStatus.SUCCESS })
}

donationSchema.statics.getSuccessfulDonations = function () {
  return this.find({ paymentStatus: PaymentStatus.SUCCESS }).sort({ createdAt: -1 })
}

donationSchema.statics.getTotalAmountByProgram = async function (programId: mongoose.Types.ObjectId): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        programId: programId,
        paymentStatus: PaymentStatus.SUCCESS
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' }
      }
    }
  ])

  return result.length > 0 ? result[0].totalAmount : 0
}

donationSchema.statics.getTotalAmountByReferral = async function (userId: mongoose.Types.ObjectId): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        attributedToUserId: userId,
        paymentStatus: PaymentStatus.SUCCESS
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' }
      }
    }
  ])

  return result.length > 0 ? result[0].totalAmount : 0
}

donationSchema.statics.getDonationStats = async function (startDate?: Date, endDate?: Date): Promise<DonationStats> {
  const matchConditions: any = {}

  if (startDate || endDate) {
    matchConditions.createdAt = {}
    if (startDate) matchConditions.createdAt.$gte = startDate
    if (endDate) matchConditions.createdAt.$lte = endDate
  }

  const [statsResult, topProgramsResult] = await Promise.all([
    this.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.SUCCESS] }, '$amount', 0] } },
          totalCount: { $sum: 1 },
          successfulCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.SUCCESS] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.FAILED] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PENDING] }, 1, 0] } },
          refundedCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.REFUNDED] }, 1, 0] } },
          averageAmount: { $avg: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.SUCCESS] }, '$amount', null] } }
        }
      }
    ]),

    this.aggregate([
      {
        $match: {
          ...matchConditions,
          paymentStatus: PaymentStatus.SUCCESS,
          programId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$programId',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'programs',
          localField: '_id',
          foreignField: '_id',
          as: 'program'
        }
      },
      {
        $project: {
          programId: '$_id',
          programName: { $arrayElemAt: ['$program.name', 0] },
          amount: 1,
          count: 1
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 }
    ])
  ])

  const stats = statsResult[0] || {
    totalAmount: 0,
    totalCount: 0,
    successfulCount: 0,
    failedCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    averageAmount: 0
  }

  return {
    ...stats,
    topPrograms: topProgramsResult || []
  }
}

// Pre-save middleware for referral attribution
donationSchema.pre('save', async function (next) {
  if (this.isNew && this.referralCodeId && !this.attributedToUserId) {
    try {
      const ReferralCode = mongoose.model('ReferralCode')
      const referralCode = await ReferralCode.findById(this.referralCodeId).populate('ownerUserId')

      if (referralCode && referralCode.ownerUserId) {
        this.attributedToUserId = referralCode.ownerUserId._id
      }
    } catch (error) {
      // Log error but don't fail the save
      console.error('Error attributing donation to referral:', error)
    }
  }

  next()
})

// Create and export the model
export const Donation = (mongoose.models?.Donation as IDonationModel) ||
  mongoose.model<IDonation, IDonationModel>('Donation', donationSchema)

// Export utility functions
export const donationUtils = {
  /**
   * Validate donation data using Zod schema
   */
  validateDonationData: (data: unknown) => {
    return donationValidationSchema.safeParse(data)
  },

  /**
   * Validate donation creation data
   */
  validateDonationCreation: (data: unknown) => {
    return donationCreationSchema.safeParse(data)
  },

  /**
   * Format amount for display
   */
  formatAmount: (amount: number, currency: CurrencyType = Currency.INR): string => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })

    return formatter.format(amount)
  },

  /**
   * Calculate net amount after fees
   */
  calculateNetAmount: (grossAmount: number): number => {
    const feePercentage = 0.0236 // 2.36% (Razorpay fees + GST)
    const fees = Math.round(grossAmount * feePercentage)
    return grossAmount - fees
  },

  /**
   * Generate donation receipt number
   */
  generateReceiptNumber: (donation: IDonation): string => {
    const date = donation.createdAt
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const id = donation._id.toString().slice(-6).toUpperCase()

    return `ARPU-${year}${month}${day}-${id}`
  }
}