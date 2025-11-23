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

// Hierarchy level enum - maps to user roles
export const HierarchyLevel = {
  NATIONAL: 'national',       // Central President
  STATE: 'state',             // State President
  STATE_COORD: 'state_coord', // State Coordinator
  ZONE: 'zone',               // Zone Coordinator
  DISTRICT_PRES: 'district_pres', // District President
  DISTRICT_COORD: 'district_coord', // District Coordinator
  BLOCK: 'block',             // Block Coordinator
  NODAL: 'nodal',             // Nodal Officer
  PRERAK: 'prerak',           // Prerak (Gram Sabha)
  PRERNA: 'prerna',           // Prerna Sakhi (Village)
  VOLUNTEER: 'volunteer'      // Volunteer (Member)
} as const

export type HierarchyLevelType = typeof HierarchyLevel[keyof typeof HierarchyLevel]

// Zod validation schemas
export const targetValidationSchema = z.object({
  assignedTo: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),

  assignedBy: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    z.null(),
    z.undefined()
  ]).optional(),

  targetAmount: z.number()
    .min(1, 'Target amount must be at least ₹1')
    .max(100000000, 'Target amount is too large'),

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
  assignedBy: true,
  targetAmount: true,
  startDate: true,
  endDate: true,
  description: true
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
})

export const targetUpdateSchema = z.object({
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

  // Assignment details
  assignedTo: mongoose.Types.ObjectId
  assignedBy?: mongoose.Types.ObjectId | null

  // Target details
  targetAmount: number        // Total target assigned

  // Collection tracking
  personalCollection: number  // Amount collected by this person directly
  teamCollection: number      // Sum of all subordinates' total collections
  totalCollection: number     // personalCollection + teamCollection

  // Status and dates
  status: TargetStatusType
  startDate: Date
  endDate: Date
  description?: string
  notes?: string

  // Hierarchical structure
  parentTargetId?: mongoose.Types.ObjectId // Parent's target (if subdivided)
  level: HierarchyLevelType
  region?: {
    state?: string
    zone?: string
    district?: string
    block?: string
    village?: string
  }

  // Subdivision tracking
  isDivided: boolean // Whether this target has been subdivided to subordinates
  subdivisions: mongoose.Types.ObjectId[] // Child target IDs

  // Calculated fields
  progressPercentage: number
  remainingAmount: number
  daysRemaining: number
  isOverdue: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  updateProgress(): Promise<ITarget>
  checkAndUpdateStatus(): Promise<ITarget>
  calculateProgress(): number
  isAchieved(): boolean
  getTotalCollection(): number
  getRemainingAmount(): number
  subdivideTarget(subdivisions: { userId: mongoose.Types.ObjectId; amount: number }[]): Promise<ITarget[]>
  updateFromSubdivisions(): Promise<ITarget>
}

// Static methods interface
export interface ITargetModel extends Model<ITarget> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<ITarget[]>
  findActiveByUser(userId: mongoose.Types.ObjectId): Promise<ITarget | null>
  findOverdueTargets(): Promise<ITarget[]>
  getTargetSummary(userId: mongoose.Types.ObjectId): Promise<TargetSummary>
  createTarget(targetData: Partial<ITarget>): Promise<ITarget>
  bulkCreateTargets(targetsData: Partial<ITarget>[]): Promise<ITarget[]>
  aggregateTeamCollection(userId: mongoose.Types.ObjectId): Promise<number>
  aggregateSubdivisionCollection(parentTargetId: mongoose.Types.ObjectId): Promise<number>
  propagateCollectionUpward(userId: mongoose.Types.ObjectId, amount: number): Promise<void>
  getHierarchyStats(userId: mongoose.Types.ObjectId): Promise<HierarchyStats>
  getDashboardData(userId: mongoose.Types.ObjectId): Promise<DashboardData>
  getLeaderboard(userId: mongoose.Types.ObjectId, limit?: number): Promise<LeaderboardEntry[]>
}

// Helper interfaces
export interface TargetSummary {
  userId: mongoose.Types.ObjectId
  totalTargets: number
  activeTarget: ITarget | null
  completedTargets: number
  inProgressTargets: number
  overdueTargets: number
  averageProgress: number
  targets: ITarget[]
}

export interface HierarchyStats {
  userId: mongoose.Types.ObjectId
  userName: string
  level: HierarchyLevelType

  // Target info
  targetAmount: number
  personalCollection: number
  teamCollection: number
  totalCollection: number
  remainingAmount: number
  achievementPercentage: number

  // Team breakdown
  teamBreakdown: {
    userId: mongoose.Types.ObjectId
    name: string
    role: string
    level: HierarchyLevelType
    targetAmount: number
    personalCollection: number
    teamCollection: number
    totalCollection: number
    achievementPercentage: number
    region?: {
      state?: string
      zone?: string
      district?: string
      block?: string
    }
  }[]

  // Statistics
  subordinatesCount: number
  activeSubordinates: number
  topPerformers: {
    userId: mongoose.Types.ObjectId
    name: string
    role: string
    collected: number
    percentage: number
  }[]
}

export interface DashboardData {
  user: {
    id: mongoose.Types.ObjectId
    name: string
    role: string
    level: HierarchyLevelType
  }
  target: {
    amount: number
    personalCollection: number
    teamCollection: number
    totalCollection: number
    remainingAmount: number
    achievementPercentage: number
    status: TargetStatusType
    daysRemaining: number
    isOverdue: boolean
  }
  team: {
    totalMembers: number
    activeMembers: number
    totalTeamCollection: number
    averageCollection: number
    topPerformers: {
      userId: mongoose.Types.ObjectId
      name: string
      collected: number
      percentage: number
    }[]
  }
  recentActivity: {
    date: Date
    userId: mongoose.Types.ObjectId
    userName: string
    amount: number
    type: 'personal' | 'team'
  }[]
  analytics: {
    dailyCollection: { date: string; amount: number }[]
    weeklyTrend: { week: string; amount: number }[]
    monthlyTrend: { month: string; amount: number }[]
  }
}

export interface LeaderboardEntry {
  rank: number
  userId: mongoose.Types.ObjectId
  name: string
  role: string
  level: HierarchyLevelType
  targetAmount: number
  totalCollection: number
  achievementPercentage: number
  region?: {
    state?: string
    zone?: string
    district?: string
  }
}

// Mongoose schema definition
const targetSchema = new Schema<ITarget>(
  {
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned to user is required'],
      index: true
    },

    assignedBy: {
      type: Schema.Types.Mixed, // Allow both ObjectId and string (for demo-admin)
      ref: 'User',
      index: true
    },

    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least ₹1'],
      max: [100000000, 'Target amount is too large']
    },

    personalCollection: {
      type: Number,
      default: 0,
      min: [0, 'Personal collection cannot be negative']
    },

    teamCollection: {
      type: Number,
      default: 0,
      min: [0, 'Team collection cannot be negative']
    },

    totalCollection: {
      type: Number,
      default: 0,
      min: [0, 'Total collection cannot be negative']
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
    },

    parentTargetId: {
      type: Schema.Types.ObjectId,
      ref: 'Target',
      index: true
    },

    level: {
      type: String,
      enum: Object.values(HierarchyLevel),
      required: true,
      index: true
    },

    region: {
      state: { type: String, trim: true },
      zone: { type: String, trim: true },
      district: { type: String, trim: true },
      block: { type: String, trim: true },
      village: { type: String, trim: true }
    },

    isDivided: {
      type: Boolean,
      default: false
    },

    subdivisions: [{
      type: Schema.Types.ObjectId,
      ref: 'Target'
    }],

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    remainingAmount: {
      type: Number,
      default: 0
    },

    daysRemaining: {
      type: Number,
      default: 0
    },

    isOverdue: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes for efficient querying
targetSchema.index({ assignedTo: 1, status: 1 })
targetSchema.index({ assignedTo: 1, startDate: -1 })
targetSchema.index({ level: 1, status: 1 })
targetSchema.index({ parentTargetId: 1 })
targetSchema.index({ 'region.state': 1, 'region.district': 1 })
targetSchema.index({ endDate: 1, status: 1 }) // For overdue queries

// Pre-save middleware to calculate fields
targetSchema.pre('save', function (next) {
  // Calculate total collection
  this.totalCollection = this.personalCollection + this.teamCollection

  // Calculate remaining amount
  this.remainingAmount = Math.max(0, this.targetAmount - this.totalCollection)

  // Calculate progress percentage
  this.progressPercentage = this.targetAmount > 0
    ? Math.min(100, (this.totalCollection / this.targetAmount) * 100)
    : 0

  // Calculate days remaining
  const today = new Date()
  const endDate = new Date(this.endDate)
  const diffTime = endDate.getTime() - today.getTime()
  this.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Check if overdue
  this.isOverdue = this.daysRemaining < 0 && this.status !== TargetStatus.COMPLETED

  // Auto-update status based on progress
  if (this.totalCollection >= this.targetAmount && this.status !== TargetStatus.CANCELLED) {
    this.status = TargetStatus.COMPLETED
  } else if (this.isOverdue && this.status === TargetStatus.IN_PROGRESS) {
    this.status = TargetStatus.OVERDUE
  } else if (this.totalCollection > 0 && this.status === TargetStatus.PENDING) {
    this.status = TargetStatus.IN_PROGRESS
  }

  next()
})

// Instance methods
targetSchema.methods.calculateProgress = function (): number {
  return this.targetAmount > 0
    ? Math.min(100, (this.totalCollection / this.targetAmount) * 100)
    : 0
}

targetSchema.methods.isAchieved = function (): boolean {
  return this.totalCollection >= this.targetAmount
}

targetSchema.methods.getTotalCollection = function (): number {
  return this.totalCollection
}

targetSchema.methods.getRemainingAmount = function (): number {
  return Math.max(0, this.targetAmount - this.totalCollection)
}

targetSchema.methods.updateProgress = async function (this: ITarget): Promise<ITarget> {
  await this.save()
  return this
}

targetSchema.methods.checkAndUpdateStatus = async function (this: ITarget): Promise<ITarget> {
  const today = new Date()

  if (this.totalCollection >= this.targetAmount) {
    this.status = TargetStatus.COMPLETED
  } else if (this.endDate < today && this.status !== TargetStatus.COMPLETED) {
    this.status = TargetStatus.OVERDUE
  } else if (this.totalCollection > 0 && this.status === TargetStatus.PENDING) {
    this.status = TargetStatus.IN_PROGRESS
  }

  await this.save()
  return this
}

targetSchema.methods.subdivideTarget = async function (
  subdivisions: { userId: mongoose.Types.ObjectId; amount: number }[]
): Promise<ITarget[]> {
  const Target = this.constructor as ITargetModel

  // Validate total subdivision doesn't exceed target
  const totalSubdivision = subdivisions.reduce((sum, sub) => sum + sub.amount, 0)
  if (totalSubdivision > this.targetAmount) {
    throw new Error('Total subdivisions exceed target amount')
  }

  // Create child targets
  const childTargets = await Promise.all(
    subdivisions.map(sub =>
      Target.create({
        assignedTo: sub.userId,
        assignedBy: this.assignedTo,
        targetAmount: sub.amount,
        startDate: this.startDate,
        endDate: this.endDate,
        parentTargetId: this._id,
        level: this.level, // Will be updated based on user role
        status: TargetStatus.PENDING
      })
    )
  )

  // Update this target
  this.isDivided = true
  this.subdivisions = childTargets.map(t => t._id)
  await this.save()

  return childTargets
}

// Static methods
targetSchema.statics.findByUser = async function (
  userId: mongoose.Types.ObjectId
): Promise<ITarget[]> {
  return this.find({ assignedTo: userId })
    .populate('assignedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
}

targetSchema.statics.findActiveByUser = async function (
  userId: mongoose.Types.ObjectId
): Promise<ITarget | null> {
  return this.findOne({
    assignedTo: userId,
    status: { $in: [TargetStatus.PENDING, TargetStatus.IN_PROGRESS, TargetStatus.OVERDUE] }
  })
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 })
}

targetSchema.statics.findOverdueTargets = async function (): Promise<ITarget[]> {
  const today = new Date()
  return this.find({
    endDate: { $lt: today },
    status: { $nin: [TargetStatus.COMPLETED, TargetStatus.CANCELLED] }
  })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
}

targetSchema.statics.getTargetSummary = async function (
  userId: mongoose.Types.ObjectId
): Promise<TargetSummary> {
  const Model = this as unknown as ITargetModel
  const targets = await Model.findByUser(userId)

  const activeTarget = await Model.findActiveByUser(userId)

  const completedTargets = targets.filter((t: ITarget) => t.status === TargetStatus.COMPLETED).length
  const inProgressTargets = targets.filter((t: ITarget) => t.status === TargetStatus.IN_PROGRESS).length
  const overdueTargets = targets.filter((t: ITarget) => t.status === TargetStatus.OVERDUE).length

  const averageProgress = targets.length > 0
    ? targets.reduce((sum: number, t: ITarget) => sum + t.progressPercentage, 0) / targets.length
    : 0

  return {
    userId,
    totalTargets: targets.length,
    activeTarget,
    completedTargets,
    inProgressTargets,
    overdueTargets,
    averageProgress,
    targets
  }
}

targetSchema.statics.createTarget = async function (
  targetData: Partial<ITarget>
): Promise<ITarget> {
  return this.create(targetData)
}

targetSchema.statics.bulkCreateTargets = async function (
  targetsData: Partial<ITarget>[]
): Promise<ITarget[]> {
  return this.insertMany(targetsData) as any
}

targetSchema.statics.aggregateTeamCollection = async function (
  userId: mongoose.Types.ObjectId
): Promise<number> {
  // Get all subordinates' targets
  const User = mongoose.model('User')
  const subordinates = await User.find({ parentCoordinatorId: userId }).select('_id')
  const subordinateIds = subordinates.map((s: any) => s._id)

  if (subordinateIds.length === 0) return 0

  // Get current date for date-range filtering
  const currentDate = new Date()

  // Sum up their total collections (only from active targets within date range)
  const targets = await this.find({
    assignedTo: { $in: subordinateIds },
    status: { $ne: TargetStatus.CANCELLED },
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate }
  })

  return targets.reduce((sum: number, target: ITarget) => sum + target.totalCollection, 0)
}

// New method: Aggregate subdivided target collections to parent
targetSchema.statics.aggregateSubdivisionCollection = async function (
  parentTargetId: mongoose.Types.ObjectId
): Promise<number> {
  // Find all child targets (subdivisions) of this parent
  const childTargets = await this.find({
    parentTargetId: parentTargetId,
    status: { $ne: TargetStatus.CANCELLED }
  })

  if (childTargets.length === 0) return 0

  // Sum up all child collections (both personal and team)
  return childTargets.reduce((sum: number, target: ITarget) => sum + target.totalCollection, 0)
}

// Method to update parent target from subdivisions
targetSchema.methods.updateFromSubdivisions = async function (this: ITarget): Promise<ITarget> {
  if (!this.isDivided || this.subdivisions.length === 0) {
    return this
  }

  const Model = this.constructor as ITargetModel

  // Get all subdivision targets
  const subdivisionTargets = await Model.find({
    _id: { $in: this.subdivisions },
    status: { $ne: TargetStatus.CANCELLED }
  })

  // Aggregate collections from all subdivisions
  const totalSubdivisionCollection = subdivisionTargets.reduce(
    (sum: number, target: ITarget) => sum + target.totalCollection,
    0
  )

  // Update parent target's team collection with subdivision totals
  this.teamCollection = totalSubdivisionCollection
  // Parent's personal collection remains separate
  // Total = personal + team (from subdivisions)
  this.totalCollection = this.personalCollection + this.teamCollection

  await this.save()
  return this
}

targetSchema.statics.propagateCollectionUpward = async function (
  userId: mongoose.Types.ObjectId,
  amount: number
): Promise<void> {
  const User = mongoose.model('User')
  const Model = this as unknown as ITargetModel

  // Find user and their hierarchy
  const user = await User.findById(userId).select('parentCoordinatorId')
  if (!user || !user.parentCoordinatorId) return

  // Update parent's target teamCollection
  const parentTarget = await Model.findActiveByUser(user.parentCoordinatorId)
  if (parentTarget) {
    // Recalculate team collection from all subordinates
    const teamCollection = await Model.aggregateTeamCollection(user.parentCoordinatorId)
    parentTarget.teamCollection = teamCollection

    // If parent has subdivisions, update from them
    if (parentTarget.isDivided && parentTarget.subdivisions.length > 0) {
      await parentTarget.updateFromSubdivisions()
    } else {
      await parentTarget.save()
    }

    // Recursively propagate upward
    await Model.propagateCollectionUpward(user.parentCoordinatorId, amount)
  }

  // Also check if this user's target is a subdivision and update its parent
  const userTarget = await Model.findActiveByUser(userId)
  if (userTarget && userTarget.parentTargetId) {
    const parentOfSubdivision = await Model.findById(userTarget.parentTargetId)
    if (parentOfSubdivision) {
      await parentOfSubdivision.updateFromSubdivisions()
    }
  }
}

targetSchema.statics.getHierarchyStats = async function (
  userId: mongoose.Types.ObjectId
): Promise<HierarchyStats> {
  const User = mongoose.model('User')
  const Model = this as unknown as ITargetModel

  // Get user details
  const user = await User.findById(userId)
    .select('name role state district zone block')
  if (!user) throw new Error('User not found')

  // Get user's active target
  const activeTarget = await Model.findActiveByUser(userId)
  if (!activeTarget) {
    return {
      userId,
      userName: user.name,
      level: HierarchyLevel.VOLUNTEER,
      targetAmount: 0,
      personalCollection: 0,
      teamCollection: 0,
      totalCollection: 0,
      remainingAmount: 0,
      achievementPercentage: 0,
      teamBreakdown: [],
      subordinatesCount: 0,
      activeSubordinates: 0,
      topPerformers: []
    }
  }

  // Get all subordinates
  const subordinates = await User.find({ parentId: userId })
    .select('_id name role state district zone block')

  // Get subordinates' targets
  const subordinateTargets = await this.find({
    assignedTo: { $in: subordinates.map(s => s._id) },
    status: { $ne: TargetStatus.CANCELLED }
  }).populate('assignedTo', 'name role')

  // Build team breakdown
  const teamBreakdown = subordinateTargets.map((target: any) => {
    const subordinate = subordinates.find((s: any) => s._id.equals(target.assignedTo._id))
    return {
      userId: target.assignedTo._id,
      name: (target.assignedTo as any).name,
      role: (target.assignedTo as any).role,
      level: target.level,
      targetAmount: target.targetAmount,
      personalCollection: target.personalCollection,
      teamCollection: target.teamCollection,
      totalCollection: target.totalCollection,
      achievementPercentage: target.progressPercentage,
      region: {
        state: subordinate?.state,
        zone: subordinate?.zone,
        district: subordinate?.district,
        block: subordinate?.block
      }
    }
  })

  // Get top performers
  const topPerformers = teamBreakdown
    .sort((a: any, b: any) => b.totalCollection - a.totalCollection)
    .slice(0, 5)
    .map((entry: any, index: number) => ({
      userId: entry.userId,
      name: entry.name,
      role: entry.role,
      collected: entry.totalCollection,
      percentage: entry.achievementPercentage
    }))

  return {
    userId,
    userName: user.name,
    level: activeTarget.level,
    targetAmount: activeTarget.targetAmount,
    personalCollection: activeTarget.personalCollection,
    teamCollection: activeTarget.teamCollection,
    totalCollection: activeTarget.totalCollection,
    remainingAmount: activeTarget.remainingAmount,
    achievementPercentage: activeTarget.progressPercentage,
    teamBreakdown,
    subordinatesCount: subordinates.length,
    activeSubordinates: subordinateTargets.length,
    topPerformers
  }
}

targetSchema.statics.getDashboardData = async function (
  userId: mongoose.Types.ObjectId
): Promise<DashboardData> {
  const User = mongoose.model('User')
  const Transaction = mongoose.model('Transaction')
  const Model = this as unknown as ITargetModel

  // Get user details
  const user = await User.findById(userId).select('name role')
  if (!user) throw new Error('User not found')

  // Get hierarchy stats
  const hierarchyStats = await Model.getHierarchyStats(userId)

  // Get recent transactions
  const recentTransactions = await Transaction.find({
    userId,
    status: 'verified'
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name')

  const recentActivity = recentTransactions.map(txn => ({
    date: txn.createdAt,
    userId: txn.userId._id,
    userName: (txn.userId as any).name,
    amount: txn.amount,
    type: 'personal' as const
  }))

  // Get analytics data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const transactions = await Transaction.find({
    userId,
    status: 'verified',
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: 1 })

  // Daily collection
  const dailyMap = new Map<string, number>()
  transactions.forEach(txn => {
    const dateStr = txn.createdAt.toISOString().split('T')[0]
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + txn.amount)
  })

  const dailyCollection = Array.from(dailyMap.entries()).map(([date, amount]) => ({
    date,
    amount
  }))

  const activeTarget = await Model.findActiveByUser(userId)

  return {
    user: {
      id: userId,
      name: user.name,
      role: user.role,
      level: hierarchyStats.level
    },
    target: {
      amount: hierarchyStats.targetAmount,
      personalCollection: hierarchyStats.personalCollection,
      teamCollection: hierarchyStats.teamCollection,
      totalCollection: hierarchyStats.totalCollection,
      remainingAmount: hierarchyStats.remainingAmount,
      achievementPercentage: hierarchyStats.achievementPercentage,
      status: activeTarget?.status || TargetStatus.PENDING,
      daysRemaining: activeTarget?.daysRemaining || 0,
      isOverdue: activeTarget?.isOverdue || false
    },
    team: {
      totalMembers: hierarchyStats.subordinatesCount,
      activeMembers: hierarchyStats.activeSubordinates,
      totalTeamCollection: hierarchyStats.teamCollection,
      averageCollection: hierarchyStats.subordinatesCount > 0
        ? hierarchyStats.teamCollection / hierarchyStats.subordinatesCount
        : 0,
      topPerformers: hierarchyStats.topPerformers
    },
    recentActivity,
    analytics: {
      dailyCollection,
      weeklyTrend: [],
      monthlyTrend: []
    }
  }
}

targetSchema.statics.getLeaderboard = async function (
  userId: mongoose.Types.ObjectId,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const User = mongoose.model('User')

  // Get user to determine scope
  const user = await User.findById(userId).select('role parentId state district')
  if (!user) throw new Error('User not found')

  // Get all users at the same or lower level
  let query: any = {}

  // If state level, show state-wide leaderboard
  if (user.state) {
    const stateUsers = await User.find({ state: user.state }).select('_id')
    query.assignedTo = { $in: stateUsers.map(u => u._id) }
  }

  const targets = await this.find({
    ...query,
    status: { $ne: TargetStatus.CANCELLED }
  })
    .populate('assignedTo', 'name role state district zone')
    .sort({ totalCollection: -1 })
    .limit(limit)

  return targets.map((target: any, index: number) => {
    const assignedUser = target.assignedTo as any
    return {
      rank: index + 1,
      userId: assignedUser._id,
      name: assignedUser.name,
      role: assignedUser.role,
      level: target.level,
      targetAmount: target.targetAmount,
      totalCollection: target.totalCollection,
      achievementPercentage: target.progressPercentage,
      region: {
        state: assignedUser.state,
        zone: assignedUser.zone,
        district: assignedUser.district
      }
    }
  })
}

// Export the model
const Target = (mongoose.models.Target || mongoose.model<ITarget, ITargetModel>('Target', targetSchema)) as ITargetModel

export default Target
export { Target }
