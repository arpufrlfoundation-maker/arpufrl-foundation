import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'
import { UserRole, UserRoleType } from './User'

// Referral code type enum
export const ReferralCodeType = {
  COORDINATOR: 'COORDINATOR',
  SUB_COORDINATOR: 'SUB_COORDINATOR'
} as const

export type ReferralCodeTypeType = typeof ReferralCodeType[keyof typeof ReferralCodeType]

// Zod validation schemas
export const referralCodeValidationSchema = z.object({
  code: z.string()
    .min(3, 'Referral code must be at least 3 characters')
    .max(50, 'Referral code must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Referral code can only contain letters, numbers, hyphens, and underscores')
    .trim(),

  ownerUserId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),

  parentCodeId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent code ID format')
    .optional(),

  type: z.enum([ReferralCodeType.COORDINATOR, ReferralCodeType.SUB_COORDINATOR]),

  region: z.string()
    .min(2, 'Region must be at least 2 characters')
    .max(50, 'Region must not exceed 50 characters')
    .optional(),

  active: z.boolean().default(true)
})

export const referralCodeCreationSchema = z.object({
  ownerUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  parentCodeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent code ID format').optional(),
  region: z.string().min(2).max(50).optional()
})

// TypeScript interface for ReferralCode document
export interface IReferralCode extends Document {
  _id: mongoose.Types.ObjectId
  code: string
  ownerUserId: mongoose.Types.ObjectId
  parentCodeId?: mongoose.Types.ObjectId

  type: ReferralCodeTypeType
  region?: string
  active: boolean

  // Performance tracking
  totalDonations: number
  totalAmount: number
  lastUsed?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  updateStats(): Promise<IReferralCode>
  deactivate(): Promise<IReferralCode>
  activate(): Promise<IReferralCode>
  getHierarchy(): Promise<IReferralCode[]>
  getSubCodes(): Promise<IReferralCode[]>
}

// Static methods interface
export interface IReferralCodeModel extends Model<IReferralCode> {
  findByCode(code: string): Promise<IReferralCode | null>
  findByOwner(userId: mongoose.Types.ObjectId): Promise<IReferralCode[]>
  findActiveByOwner(userId: mongoose.Types.ObjectId): Promise<IReferralCode | null>
  generateUniqueCode(name: string, region?: string): Promise<string>
  createForUser(userId: mongoose.Types.ObjectId, parentCodeId?: mongoose.Types.ObjectId): Promise<IReferralCode>
  updateAllStats(): Promise<void>
  getTopPerformers(limit?: number): Promise<ReferralPerformance[]>
}

// Helper interfaces
export interface ReferralPerformance {
  referralCodeId: mongoose.Types.ObjectId
  code: string
  ownerName: string
  ownerUserId: mongoose.Types.ObjectId
  totalAmount: number
  totalDonations: number
  averageDonation: number
  region?: string
  type: ReferralCodeTypeType
}

export interface ReferralHierarchy {
  code: IReferralCode
  subCodes: ReferralHierarchy[]
  totalAmount: number
  totalDonations: number
}

// Mongoose schema definition
const referralCodeSchema = new Schema<IReferralCode>({
  code: {
    type: String,
    required: [true, 'Referral code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [3, 'Referral code must be at least 3 characters'],
    maxlength: [50, 'Referral code must not exceed 50 characters'],
    match: [/^[A-Z0-9-_]+$/, 'Referral code can only contain uppercase letters, numbers, hyphens, and underscores'],
    index: true
  },

  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner user ID is required'],
    index: true
  },

  parentCodeId: {
    type: Schema.Types.ObjectId,
    ref: 'ReferralCode',
    index: true,
    validate: {
      validator: async function (this: IReferralCode, value: mongoose.Types.ObjectId) {
        if (!value) return true

        // Validate that parent code exists and belongs to a coordinator
        const parentCode = await mongoose.model('ReferralCode').findById(value).populate('ownerUserId')
        if (!parentCode) return false

        const parentUser = parentCode.ownerUserId as any
        return parentUser && (parentUser.role === UserRole.ADMIN || parentUser.role === UserRole.COORDINATOR)
      },
      message: 'Parent code must belong to an admin or coordinator'
    }
  },

  type: {
    type: String,
    enum: Object.values(ReferralCodeType),
    required: [true, 'Referral code type is required'],
    index: true
  },

  region: {
    type: String,
    trim: true,
    minlength: [2, 'Region must be at least 2 characters'],
    maxlength: [50, 'Region must not exceed 50 characters'],
    index: true
  },

  active: {
    type: Boolean,
    default: true,
    required: [true, 'Active status is required'],
    index: true
  },

  // Performance tracking
  totalDonations: {
    type: Number,
    default: 0,
    min: [0, 'Total donations cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Total donations must be a whole number'
    }
  },

  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Total amount must be a whole number'
    }
  },

  lastUsed: {
    type: Date,
    index: true
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
// referralCodeSchema.index({ code: 1 }, { unique: true })
// referralCodeSchema.index({ ownerUserId: 1, active: 1 })
// referralCodeSchema.index({ parentCodeId: 1 })
// referralCodeSchema.index({ type: 1, active: 1 })
// referralCodeSchema.index({ totalAmount: -1 })
// referralCodeSchema.index({ region: 1, active: 1 })

// Pre-save middleware for type determination
referralCodeSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Determine type based on owner's role and parent code
    const User = mongoose.model('User')
    const owner = await User.findById(this.ownerUserId)

    if (!owner) {
      return next(new Error('Owner user not found'))
    }

    if (owner.role === 'ADMIN' || owner.role === 'COORDINATOR') {
      this.type = ReferralCodeType.COORDINATOR
    } else if (owner.role === 'SUB_COORDINATOR') {
      this.type = ReferralCodeType.SUB_COORDINATOR

      // Sub-coordinators must have a parent code
      if (!this.parentCodeId) {
        return next(new Error('Sub-coordinators must have a parent referral code'))
      }
    } else {
      return next(new Error('Only coordinators and sub-coordinators can have referral codes'))
    }

    // Set region from owner if not provided
    if (!this.region && owner.region) {
      this.region = owner.region
    }
  }

  next()
})

// Instance methods
referralCodeSchema.methods.updateStats = async function (): Promise<IReferralCode> {
  const Donation = mongoose.model('Donation')

  const stats = await Donation.aggregate([
    {
      $match: {
        referralCodeId: this._id,
        paymentStatus: 'SUCCESS'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        lastUsed: { $max: '$createdAt' }
      }
    }
  ])

  if (stats.length > 0) {
    this.totalAmount = stats[0].totalAmount || 0
    this.totalDonations = stats[0].totalCount || 0
    this.lastUsed = stats[0].lastUsed
  } else {
    this.totalAmount = 0
    this.totalDonations = 0
  }

  return await this.save()
}

referralCodeSchema.methods.deactivate = async function (): Promise<IReferralCode> {
  this.active = false
  return await this.save()
}

referralCodeSchema.methods.activate = async function (): Promise<IReferralCode> {
  this.active = true
  return await this.save()
}

referralCodeSchema.methods.getHierarchy = async function (): Promise<IReferralCode[]> {
  const hierarchy: IReferralCode[] = []
  let currentCode: IReferralCode = this as IReferralCode

  // Go up the hierarchy
  while (currentCode) {
    hierarchy.unshift(currentCode)

    if (currentCode.parentCodeId) {
      const parentCode = await mongoose.model('ReferralCode').findById(currentCode.parentCodeId)
      if (parentCode) {
        currentCode = parentCode as IReferralCode
      } else {
        break
      }
    } else {
      break
    }
  }

  return hierarchy
}

referralCodeSchema.methods.getSubCodes = async function (): Promise<IReferralCode[]> {
  return await mongoose.model('ReferralCode').find({
    parentCodeId: this._id,
    active: true
  }).populate('ownerUserId')
}

// Static methods
referralCodeSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase(), active: true }).populate('ownerUserId')
}

referralCodeSchema.statics.findByOwner = function (userId: mongoose.Types.ObjectId) {
  return this.find({ ownerUserId: userId }).sort({ createdAt: -1 })
}

referralCodeSchema.statics.findActiveByOwner = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ ownerUserId: userId, active: true })
}

referralCodeSchema.statics.generateUniqueCode = async function (name: string, region?: string): Promise<string> {
  // Clean and format the name
  const cleanName = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(word => word.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 6)

  // Clean and format the region
  const cleanRegion = region
    ? region.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
    : ''

  // Generate base code
  let baseCode = cleanName
  if (cleanRegion) {
    baseCode += `-${cleanRegion}`
  }

  // Ensure minimum length
  if (baseCode.length < 3) {
    baseCode = baseCode.padEnd(3, 'X')
  }

  // Find unique code
  let code = baseCode
  let counter = 1

  while (true) {
    const existing = await this.findOne({ code })
    if (!existing) {
      return code
    }

    code = `${baseCode}-${counter.toString().padStart(2, '0')}`
    counter++

    // Prevent infinite loop
    if (counter > 999) {
      throw new Error('Unable to generate unique referral code')
    }
  }
}

referralCodeSchema.statics.createForUser = async function (
  userId: mongoose.Types.ObjectId,
  parentCodeId?: mongoose.Types.ObjectId
): Promise<IReferralCode> {
  const User = mongoose.model('User')
  const user = await User.findById(userId)

  if (!user) {
    throw new Error('User not found')
  }

  // Check if user already has an active referral code
  const existingCode = await (this as IReferralCodeModel).findActiveByOwner(userId)
  if (existingCode) {
    throw new Error('User already has an active referral code')
  }

  // Generate unique code
  const code = await (this as IReferralCodeModel).generateUniqueCode(user.name, user.region)

  // Create referral code
  const referralCode = new this({
    code,
    ownerUserId: userId,
    parentCodeId,
    region: user.region
  })

  return await referralCode.save()
}

referralCodeSchema.statics.updateAllStats = async function () {
  const referralCodes = await this.find({})

  for (const code of referralCodes) {
    await code.updateStats()
  }
}

referralCodeSchema.statics.getTopPerformers = async function (limit = 10): Promise<ReferralPerformance[]> {
  const performers = await this.aggregate([
    {
      $match: { active: true }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ownerUserId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    {
      $unwind: '$owner'
    },
    {
      $project: {
        referralCodeId: '$_id',
        code: 1,
        ownerName: '$owner.name',
        ownerUserId: '$ownerUserId',
        totalAmount: 1,
        totalDonations: 1,
        averageDonation: {
          $cond: [
            { $gt: ['$totalDonations', 0] },
            { $divide: ['$totalAmount', '$totalDonations'] },
            0
          ]
        },
        region: 1,
        type: 1
      }
    },
    {
      $sort: { totalAmount: -1 }
    },
    {
      $limit: limit
    }
  ])

  return performers
}

// Create and export the model
export const ReferralCode = (mongoose.models?.ReferralCode as IReferralCodeModel) ||
  mongoose.model<IReferralCode, IReferralCodeModel>('ReferralCode', referralCodeSchema)

// Export utility functions
export const referralCodeUtils = {
  /**
   * Validate referral code data using Zod schema
   */
  validateReferralCodeData: (data: unknown) => {
    return referralCodeValidationSchema.safeParse(data)
  },

  /**
   * Validate referral code creation data
   */
  validateReferralCodeCreation: (data: unknown) => {
    return referralCodeCreationSchema.safeParse(data)
  },

  /**
   * Build referral hierarchy tree
   */
  buildHierarchyTree: async (rootCodeId: mongoose.Types.ObjectId): Promise<ReferralHierarchy> => {
    const rootCode = await ReferralCode.findById(rootCodeId)
    if (!rootCode) {
      throw new Error('Root referral code not found')
    }

    const buildTree = async (code: IReferralCode): Promise<ReferralHierarchy> => {
      const subCodes = await code.getSubCodes()
      const subTrees = await Promise.all(subCodes.map(buildTree))

      const totalAmount = code.totalAmount + subTrees.reduce((sum, tree) => sum + tree.totalAmount, 0)
      const totalDonations = code.totalDonations + subTrees.reduce((sum, tree) => sum + tree.totalDonations, 0)

      return {
        code,
        subCodes: subTrees,
        totalAmount,
        totalDonations
      }
    }

    return await buildTree(rootCode)
  },

  /**
   * Resolve referral code from string
   */
  resolveReferralCode: async (codeString: string): Promise<IReferralCode | null> => {
    if (!codeString || typeof codeString !== 'string') {
      return null
    }

    const cleanCode = codeString.trim().toUpperCase()
    if (cleanCode.length < 3) {
      return null
    }

    return await ReferralCode.findByCode(cleanCode)
  },

  /**
   * Get referral attribution chain
   */
  getAttributionChain: async (referralCodeId: mongoose.Types.ObjectId): Promise<IReferralCode[]> => {
    const referralCode = await ReferralCode.findById(referralCodeId)
    if (!referralCode) {
      return []
    }

    return await referralCode.getHierarchy()
  }
}