import mongoose from 'mongoose'
import { ReferralCode, IReferralCode, ReferralHierarchy } from '@/models/ReferralCode'
import { User, IUser, UserRole } from '@/models/User'
import { Donation, IDonation, PaymentStatus } from '@/models/Donation'

// Define coordinator roles array
const coordinatorRoles = [
  UserRole.CENTRAL_PRESIDENT,
  UserRole.STATE_PRESIDENT,
  UserRole.STATE_COORDINATOR,
  UserRole.ZONE_COORDINATOR,
  UserRole.DISTRICT_PRESIDENT,
  UserRole.DISTRICT_COORDINATOR,
  UserRole.BLOCK_COORDINATOR,
  UserRole.NODAL_OFFICER,
  UserRole.PRERAK,
  UserRole.PRERNA_SAKHI
]

export interface AttributionResult {
  referralCodeId: mongoose.Types.ObjectId
  attributedToUserId: mongoose.Types.ObjectId
  hierarchyChain: IReferralCode[]
  attributionPercentages: AttributionPercentage[]
}

export interface AttributionPercentage {
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  percentage: number
  amount: number
}

export interface PerformanceMetrics {
  totalDonations: number
  totalAmount: number
  averageDonation: number
  conversionRate: number
  monthlyTrends: MonthlyTrend[]
  topPrograms: ProgramPerformance[]
  hierarchyPerformance: HierarchyPerformance[]
}

export interface MonthlyTrend {
  year: number
  month: number
  donations: number
  amount: number
  date: Date
}

export interface ProgramPerformance {
  programId: mongoose.Types.ObjectId
  programName: string
  donations: number
  amount: number
  percentage: number
}

export interface HierarchyPerformance {
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  referralCode: string
  directDonations: number
  directAmount: number
  hierarchyDonations: number
  hierarchyAmount: number
  subCoordinators: number
}

export class ReferralAttributionService {
  /**
   * Attribute a donation to referral code and hierarchy
   */
  static async attributeDonation(
    donationId: mongoose.Types.ObjectId,
    referralCodeString?: string
  ): Promise<AttributionResult | null> {
    if (!referralCodeString) {
      return null
    }

    // Resolve referral code
    const referralCode = await ReferralCode.findByCode(referralCodeString)
    if (!referralCode) {
      return null
    }

    // Get hierarchy chain
    const hierarchyChain = await referralCode.getHierarchy()

    // Calculate attribution percentages (example: 70% to direct referrer, 30% to parent)
    const attributionPercentages = await this.calculateAttributionPercentages(
      hierarchyChain,
      donationId
    )

    return {
      referralCodeId: referralCode._id,
      attributedToUserId: referralCode.ownerUserId,
      hierarchyChain,
      attributionPercentages
    }
  }

  /**
   * Calculate attribution percentages for hierarchy
   */
  private static async calculateAttributionPercentages(
    hierarchyChain: IReferralCode[],
    donationId: mongoose.Types.ObjectId
  ): Promise<AttributionPercentage[]> {
    const donation = await Donation.findById(donationId)
    if (!donation) {
      return []
    }

    const attributions: AttributionPercentage[] = []
    const totalAmount = donation.amount

    // Attribution rules:
    // - Direct referrer gets 70%
    // - Parent coordinator gets 20%
    // - Admin/Organization gets 10%

    if (hierarchyChain.length > 0) {
      const directReferrer = hierarchyChain[hierarchyChain.length - 1]
      await directReferrer.populate('ownerUserId')

      attributions.push({
        userId: directReferrer.ownerUserId._id,
        userName: (directReferrer.ownerUserId as any).name,
        userRole: (directReferrer.ownerUserId as any).role,
        percentage: 70,
        amount: Math.round(totalAmount * 0.7)
      })

      // Parent coordinator attribution
      if (hierarchyChain.length > 1) {
        const parentReferrer = hierarchyChain[hierarchyChain.length - 2]
        await parentReferrer.populate('ownerUserId')

        attributions.push({
          userId: parentReferrer.ownerUserId._id,
          userName: (parentReferrer.ownerUserId as any).name,
          userRole: (parentReferrer.ownerUserId as any).role,
          percentage: 20,
          amount: Math.round(totalAmount * 0.2)
        })
      }

      // Organization gets remaining 10% (or 30% if no parent)
      const organizationPercentage = hierarchyChain.length > 1 ? 10 : 30
      attributions.push({
        userId: new mongoose.Types.ObjectId('000000000000000000000000'), // Placeholder for organization
        userName: 'Organization',
        userRole: 'ORGANIZATION',
        percentage: organizationPercentage,
        amount: Math.round(totalAmount * (organizationPercentage / 100))
      })
    }

    return attributions
  }

  /**
   * Update referral code statistics
   */
  static async updateReferralStats(referralCodeId: mongoose.Types.ObjectId): Promise<void> {
    const referralCode = await ReferralCode.findById(referralCodeId)
    if (!referralCode) {
      return
    }

    await referralCode.updateStats()
  }

  /**
   * Update all referral statistics (batch operation)
   */
  static async updateAllReferralStats(): Promise<void> {
    await ReferralCode.updateAllStats()
  }

  /**
   * Get performance metrics for a user
   */
  static async getPerformanceMetrics(
    userId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
    includeHierarchy = false
  ): Promise<PerformanceMetrics> {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get user's referral codes
    let referralCodeIds: mongoose.Types.ObjectId[] = []

    if (includeHierarchy && (user.role === UserRole.ADMIN || coordinatorRoles.includes(user.role as any))) {
      // Include subordinate referral codes
      const subordinateUserIds = await User.find({
        $or: [
          { _id: userId },
          { parentCoordinatorId: userId }
        ]
      }).distinct('_id')

      referralCodeIds = await ReferralCode.find({
        ownerUserId: { $in: subordinateUserIds }
      }).distinct('_id')
    } else {
      // Only user's own referral codes
      referralCodeIds = await ReferralCode.find({
        ownerUserId: userId
      }).distinct('_id')
    }

    // Build date filter
    const dateFilter: any = { paymentStatus: PaymentStatus.SUCCESS }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    // Get basic metrics
    const [basicMetrics, monthlyTrends, topPrograms, hierarchyPerformance] = await Promise.all([
      this.getBasicMetrics(referralCodeIds, dateFilter),
      this.getMonthlyTrends(referralCodeIds, dateFilter),
      this.getTopPrograms(referralCodeIds, dateFilter),
      this.getHierarchyPerformance(userId, dateFilter)
    ])

    return {
      ...basicMetrics,
      monthlyTrends,
      topPrograms,
      hierarchyPerformance
    }
  }

  /**
   * Get basic performance metrics
   */
  private static async getBasicMetrics(
    referralCodeIds: mongoose.Types.ObjectId[],
    dateFilter: any
  ): Promise<Omit<PerformanceMetrics, 'monthlyTrends' | 'topPrograms' | 'hierarchyPerformance'>> {
    const matchFilter = {
      ...dateFilter,
      referralCodeId: { $in: referralCodeIds }
    }

    const [stats, activeCodesCount] = await Promise.all([
      Donation.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageDonation: { $avg: '$amount' }
          }
        }
      ]),
      ReferralCode.countDocuments({
        _id: { $in: referralCodeIds },
        active: true
      })
    ])

    const metrics = stats[0] || {
      totalDonations: 0,
      totalAmount: 0,
      averageDonation: 0
    }

    return {
      ...metrics,
      conversionRate: activeCodesCount > 0 ? metrics.totalDonations / activeCodesCount : 0
    }
  }

  /**
   * Get monthly performance trends
   */
  private static async getMonthlyTrends(
    referralCodeIds: mongoose.Types.ObjectId[],
    dateFilter: any
  ): Promise<MonthlyTrend[]> {
    const matchFilter = {
      ...dateFilter,
      referralCodeId: { $in: referralCodeIds }
    }

    const trends = await Donation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          donations: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          donations: 1,
          amount: 1,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            }
          }
        }
      },
      { $sort: { date: 1 } },
      { $limit: 12 }
    ])

    return trends
  }

  /**
   * Get top performing programs
   */
  private static async getTopPrograms(
    referralCodeIds: mongoose.Types.ObjectId[],
    dateFilter: any
  ): Promise<ProgramPerformance[]> {
    const matchFilter = {
      ...dateFilter,
      referralCodeId: { $in: referralCodeIds },
      programId: { $exists: true }
    }

    const programs = await Donation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$programId',
          donations: { $sum: 1 },
          amount: { $sum: '$amount' }
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
          donations: 1,
          amount: 1
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 }
    ])

    // Calculate percentages
    const totalAmount = programs.reduce((sum, p) => sum + p.amount, 0)

    return programs.map(program => ({
      ...program,
      percentage: totalAmount > 0 ? (program.amount / totalAmount) * 100 : 0
    }))
  }

  /**
   * Get hierarchy performance
   */
  private static async getHierarchyPerformance(
    userId: mongoose.Types.ObjectId,
    dateFilter: any
  ): Promise<HierarchyPerformance[]> {
    const user = await User.findById(userId)
    if (!user || (user.role !== UserRole.ADMIN && !coordinatorRoles.includes(user.role as any))) {
      return []
    }

    // Get all users in hierarchy
    const hierarchyUsers = await User.find({
      $or: [
        { _id: userId },
        { parentCoordinatorId: userId }
      ]
    })

    const performance: HierarchyPerformance[] = []

    for (const hierarchyUser of hierarchyUsers) {
      const referralCode = await ReferralCode.findActiveByOwner(hierarchyUser._id)
      if (!referralCode) continue

      // Get direct donations
      const directStats = await Donation.aggregate([
        {
          $match: {
            ...dateFilter,
            referralCodeId: referralCode._id
          }
        },
        {
          $group: {
            _id: null,
            donations: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ])

      // Get hierarchy donations (including sub-coordinators)
      const subCoordinatorIds = await User.find({
        parentCoordinatorId: hierarchyUser._id
      }).distinct('_id')

      const subReferralCodeIds = await ReferralCode.find({
        ownerUserId: { $in: subCoordinatorIds }
      }).distinct('_id')

      const hierarchyStats = await Donation.aggregate([
        {
          $match: {
            ...dateFilter,
            referralCodeId: { $in: [...subReferralCodeIds, referralCode._id] }
          }
        },
        {
          $group: {
            _id: null,
            donations: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ])

      const direct = directStats[0] || { donations: 0, amount: 0 }
      const hierarchy = hierarchyStats[0] || { donations: 0, amount: 0 }

      performance.push({
        userId: hierarchyUser._id,
        userName: hierarchyUser.name,
        userRole: hierarchyUser.role,
        referralCode: referralCode.code,
        directDonations: direct.donations,
        directAmount: direct.amount,
        hierarchyDonations: hierarchy.donations,
        hierarchyAmount: hierarchy.amount,
        subCoordinators: subCoordinatorIds.length
      })
    }

    return performance.sort((a, b) => b.hierarchyAmount - a.hierarchyAmount)
  }

  /**
   * Build referral hierarchy tree with performance data
   */
  static async buildPerformanceHierarchy(
    rootUserId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReferralHierarchy | null> {
    const rootReferralCode = await ReferralCode.findActiveByOwner(rootUserId)
    if (!rootReferralCode) {
      return null
    }

    const dateFilter: any = { paymentStatus: PaymentStatus.SUCCESS }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const buildTree = async (referralCode: IReferralCode): Promise<ReferralHierarchy> => {
      const subCodes = await referralCode.getSubCodes()
      const subTrees = await Promise.all(subCodes.map(buildTree))

      // Get performance data for this code
      const performance = await Donation.aggregate([
        {
          $match: {
            ...dateFilter,
            referralCodeId: referralCode._id
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalDonations: { $sum: 1 }
          }
        }
      ])

      const stats = performance[0] || { totalAmount: 0, totalDonations: 0 }
      const subTreeTotals = subTrees.reduce(
        (acc, tree) => ({
          totalAmount: acc.totalAmount + tree.totalAmount,
          totalDonations: acc.totalDonations + tree.totalDonations
        }),
        { totalAmount: 0, totalDonations: 0 }
      )

      return {
        code: referralCode,
        subCodes: subTrees,
        totalAmount: stats.totalAmount + subTreeTotals.totalAmount,
        totalDonations: stats.totalDonations + subTreeTotals.totalDonations
      }
    }

    return await buildTree(rootReferralCode)
  }
}