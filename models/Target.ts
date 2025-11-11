import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'
import { UserRoleType } from './User'

// Target status enum
export const TargetStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const

export type TargetStatusType = typeof TargetStatus[keyof typeof TargetStatus]

// Target type enum
export const TargetType = {
  DONATION_AMOUNT: 'DONATION_AMOUNT',
  DONATION_COUNT: 'DONATION_COUNT',
  REFERRAL_COUNT: 'REFERRAL_COUNT',
  NEW_DONORS: 'NEW_DONORS'
} as const

export type TargetTypeType = typeof TargetType[keyof typeof TargetType]

// Zod validation schemas
export const targetValidationSchema = z.object({
  assignedTo: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),

  assignedBy: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),

  type: z.enum([
    TargetType.DONATION_AMOUNT,
    TargetType.DONATION_COUNT,
    TargetType.REFERRAL_COUNT,
    TargetType.NEW_DONORS
  ]),

  targetValue: z.number()
    .min(1, 'Target value must be at least 1')
    .max(10000000, 'Target value is too large'),

  currentValue: z.number()
    .min(0, 'Current value cannot be negative')
    .default(0),

  status: z.enum([
    TargetStatus.PENDING,
    TargetStatus.IN_PROGRESS,
    TargetStatus.COMPLETED,
    TargetStatus.OVERDUE,
    TargetStatus.CANCELLED
  ]).default(TargetStatus.PENDING),

  startDate: z.date(),

  endDate: z.date(),

  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),

  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
})

export const targetCreationSchema = targetValidationSchema.pick({
  assignedTo: true,
  type: true,
  targetValue: true,
  startDate: true,
  endDate: true,
  description: true
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
})

export const targetUpdateSchema = z.object({
  currentValue: z.number().min(0).optional(),
  status: z.enum([
    TargetStatus.PENDING,
    TargetStatus.IN_PROGRESS,
    TargetStatus.COMPLETED,
    TargetStatus.OVERDUE,
    TargetStatus.CANCELLED
  ]).optional(),
  notes: z.string().max(1000).optional()
})

// TypeScript interface for Target document
export interface ITarget extends Document {
  _id: mongoose.Types.ObjectId
  assignedTo: mongoose.Types.ObjectId
  assignedBy: mongoose.Types.ObjectId
  type: TargetTypeType
  targetValue: number
  currentValue: number
  status: TargetStatusType
  startDate: Date
  endDate: Date
  description?: string
  notes?: string

  // Calculated fields
  progressPercentage: number
  daysRemaining: number
  isOverdue: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  updateProgress(value: number): Promise<ITarget>
  checkAndUpdateStatus(): Promise<ITarget>
  calculateProgress(): number
  isAchieved(): boolean
}

// Static methods interface
export interface ITargetModel extends Model<ITarget> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<ITarget[]>
  findActiveByUser(userId: mongoose.Types.ObjectId): Promise<ITarget[]>
  findOverdueTargets(): Promise<ITarget[]>
  getTargetSummary(userId: mongoose.Types.ObjectId): Promise<TargetSummary>
  createTarget(targetData: Partial<ITarget>): Promise<ITarget>
  bulkCreateTargets(targetsData: Partial<ITarget>[]): Promise<ITarget[]>
}

// Helper interfaces
export interface TargetSummary {
  userId: mongoose.Types.ObjectId
  totalTargets: number
  completedTargets: number
  inProgressTargets: number
  overdueTargets: number
  averageProgress: number
  targets: ITarget[]
}

// Mongoose schema definition
const targetSchema = new Schema<ITarget>({
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned to user is required'],
    index: true
  },

  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user is required'],
    index: true
  },

  type: {
    type: String,
    enum: Object.values(TargetType),
    required: [true, 'Target type is required'],
    index: true
  },

  targetValue: {
    type: Number,
    required: [true, 'Target value is required'],
    min: [1, 'Target value must be at least 1'],
    max: [10000000, 'Target value is too large']
  },

  currentValue: {
    type: Number,
    default: 0,
    min: [0, 'Current value cannot be negative']
  },

  status: {
    type: String,
    enum: Object.values(TargetStatus),
    default: TargetStatus.PENDING,
    index: true
  },

  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },

  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    index: true,
    validate: {
      validator: function (this: ITarget, value: Date) {
        return value > this.startDate
      },
      message: 'End date must be after start date'
    }
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters']
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must not exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual fields
targetSchema.virtual('progressPercentage').get(function () {
  if (this.targetValue === 0) return 0
  return Math.min((this.currentValue / this.targetValue) * 100, 100)
})

targetSchema.virtual('daysRemaining').get(function () {
  const now = new Date()
  const end = new Date(this.endDate)
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

targetSchema.virtual('isOverdue').get(function () {
  return new Date() > new Date(this.endDate) && this.status !== TargetStatus.COMPLETED
})

// Indexes for performance
targetSchema.index({ assignedTo: 1, status: 1 })
targetSchema.index({ assignedBy: 1, createdAt: -1 })
targetSchema.index({ endDate: 1, status: 1 })

// Instance methods
targetSchema.methods.updateProgress = async function (value: number): Promise<ITarget> {
  this.currentValue = Math.max(0, value)
  await this.checkAndUpdateStatus()
  return await this.save()
}

targetSchema.methods.checkAndUpdateStatus = async function (this: ITarget): Promise<ITarget> {
  const now = new Date()

  // Check if target is achieved
  if (this.currentValue >= this.targetValue) {
    this.status = TargetStatus.COMPLETED
  }
  // Check if target is overdue
  else if (now > this.endDate) {
    this.status = TargetStatus.OVERDUE
  }
  // Check if target is in progress
  else if (this.currentValue > 0 && this.status === TargetStatus.PENDING) {
    this.status = TargetStatus.IN_PROGRESS
  }

  // @ts-ignore - Mongoose typing complexity
  return this
}

targetSchema.methods.calculateProgress = function (): number {
  if (this.targetValue === 0) return 0
  return Math.min((this.currentValue / this.targetValue) * 100, 100)
}

targetSchema.methods.isAchieved = function (): boolean {
  return this.currentValue >= this.targetValue
}

// Static methods
targetSchema.statics.findByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({ assignedTo: userId })
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 })
}

targetSchema.statics.findActiveByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({
    assignedTo: userId,
    status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS] }
  })
    .populate('assignedBy', 'name email role')
    .sort({ endDate: 1 })
}

targetSchema.statics.findOverdueTargets = function () {
  return this.find({
    endDate: { $lt: new Date() },
    status: { $nin: [TargetStatus.COMPLETED, TargetStatus.CANCELLED] }
  })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
}

// @ts-ignore - Mongoose static method typing
targetSchema.statics.getTargetSummary = async function (this: ITargetModel, userId: mongoose.Types.ObjectId): Promise<TargetSummary> {
  // @ts-ignore - Mongoose static method typing
  const targets = await this.findByUser(userId)

  const summary: TargetSummary = {
    userId,
    totalTargets: targets.length,
    // @ts-ignore - Filter typing with Mongoose documents
    completedTargets: targets.filter((t: any) => t.status === TargetStatus.COMPLETED).length,
    // @ts-ignore
    inProgressTargets: targets.filter((t: any) => t.status === TargetStatus.IN_PROGRESS).length,
    // @ts-ignore
    overdueTargets: targets.filter((t: any) => t.isOverdue).length,
    averageProgress: 0,
    targets
  }

  if (targets.length > 0) {
    // @ts-ignore - Reduce typing with Mongoose documents
    const totalProgress = targets.reduce((sum: any, t: any) => sum + t.calculateProgress(), 0)
    summary.averageProgress = totalProgress / targets.length
  }

  return summary
}

targetSchema.statics.createTarget = async function (targetData: Partial<ITarget>): Promise<ITarget> {
  const target = new this(targetData)
  return await target.save()
}

targetSchema.statics.bulkCreateTargets = async function (targetsData: Partial<ITarget>[]): Promise<ITarget[]> {
  const created = await this.insertMany(targetsData)
  // @ts-ignore - Mongoose insertMany return type complexity
  return created as unknown as ITarget[]
}

// Pre-save middleware to check and update status
targetSchema.pre('save', async function (next) {
  if (this.isModified('currentValue') || this.isModified('endDate')) {
    await this.checkAndUpdateStatus()
  }
  next()
})

// Create and export the model
export const Target = (mongoose.models?.Target as ITargetModel) ||
  mongoose.model<ITarget, ITargetModel>('Target', targetSchema)

// Export utility functions
export const targetUtils = {
  /**
   * Validate target data using Zod schema
   */
  validateTargetData: (data: unknown) => {
    return targetValidationSchema.safeParse(data)
  },

  /**
   * Validate target creation data
   */
  validateCreationData: (data: unknown) => {
    return targetCreationSchema.safeParse(data)
  },

  /**
   * Validate target update data
   */
  validateUpdateData: (data: unknown) => {
    return targetUpdateSchema.safeParse(data)
  },

  /**
   * Calculate overall performance for a user
   */
  calculatePerformance: (targets: ITarget[]) => {
    const completed = targets.filter(t => t.status === TargetStatus.COMPLETED).length
    const total = targets.length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const avgProgress = total > 0
      ? targets.reduce((sum, t) => sum + t.calculateProgress(), 0) / total
      : 0

    return {
      totalTargets: total,
      completedTargets: completed,
      completionRate,
      averageProgress: avgProgress,
      onTrack: targets.filter(t => !t.isOverdue && t.status === TargetStatus.IN_PROGRESS).length,
      overdue: targets.filter(t => t.isOverdue).length
    }
  }
}
