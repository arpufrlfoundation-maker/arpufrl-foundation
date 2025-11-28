import mongoose from 'mongoose'
import { User } from '@/models/User'
import { CommissionLog } from '@/models/CommissionLog'
import { isDemoAdminById } from '@/lib/demo-admin'

/**
 * Commission Rules:
 * - Volunteer: 0% personal (no commission)
 *   - If volunteer has a parent coordinator: parent gets 5% commission
 * - Non-Volunteer (any coordinator/officer): 15% personal, all upper levels get 2% each
 */

const NON_VOLUNTEER_COMMISSION = 15 // 15%
const VOLUNTEER_PARENT_COMMISSION = 5 // 5% for volunteer's parent coordinator
const HIERARCHY_COMMISSION = 2 // 2% for each upper level

const VOLUNTEER_ROLES = ['VOLUNTEER']

interface CommissionDistribution {
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  hierarchyLevel: string
  commissionAmount: number
  commissionPercentage: number
}

interface CalculateCommissionResult {
  distributions: CommissionDistribution[]
  totalCommission: number
  organizationFund: number
  summary: {
    personalCommission: number
    hierarchyCommissions: number
    levelsInvolved: number
  }
}

/**
 * Calculate commission distribution for a donation
 * @param donatedToUserId - The user who received the donation
 * @param donationAmount - The total donation amount
 * @returns Commission distribution details
 */
export async function calculateCommissionDistribution(
  donatedToUserId: mongoose.Types.ObjectId | string,
  donationAmount: number
): Promise<CalculateCommissionResult> {
  const distributions: CommissionDistribution[] = []
  let totalCommission = 0

  // Get the user who received the donation
  const recipient = await User.findById(donatedToUserId)
    .select('name role parentCoordinatorId state district zone block')

  if (!recipient) {
    throw new Error('Recipient user not found')
  }

  // Determine personal commission percentage
  const isVolunteer = VOLUNTEER_ROLES.includes(recipient.role)
  const personalCommissionPercentage = isVolunteer
    ? 0 // Volunteers get 0% commission
    : NON_VOLUNTEER_COMMISSION

  const personalCommission = (donationAmount * personalCommissionPercentage) / 100

  // Add recipient's commission (only if not a volunteer)
  if (!isVolunteer) {
    distributions.push({
      userId: recipient._id,
      userName: recipient.name,
      userRole: recipient.role,
      hierarchyLevel: getHierarchyLevel(recipient.role),
      commissionAmount: personalCommission,
      commissionPercentage: personalCommissionPercentage
    })

    totalCommission += personalCommission
  }

  // Calculate hierarchy commissions (traverse upward)
  // Special rule: If recipient is volunteer, parent gets 5% instead of 2%
  const hierarchyCommissions = await calculateHierarchyCommissions(
    recipient,
    donationAmount,
    isVolunteer
  )

  distributions.push(...hierarchyCommissions.distributions)
  totalCommission += hierarchyCommissions.totalCommission

  // Organization fund (remaining amount)
  const organizationFund = donationAmount - totalCommission

  return {
    distributions,
    totalCommission,
    organizationFund,
    summary: {
      personalCommission,
      hierarchyCommissions: hierarchyCommissions.totalCommission,
      levelsInvolved: hierarchyCommissions.distributions.length
    }
  }
}

/**
 * Calculate commissions for all hierarchy levels above the recipient
 */
async function calculateHierarchyCommissions(
  startUser: any,
  donationAmount: number,
  isVolunteer: boolean = false
): Promise<{ distributions: CommissionDistribution[]; totalCommission: number }> {
  const distributions: CommissionDistribution[] = []
  let totalCommission = 0
  let currentUserId = startUser.parentCoordinatorId

  const visited = new Set<string>()
  visited.add(startUser._id.toString())

  // Traverse up the hierarchy
  let isFirstParent = true
  while (currentUserId && !visited.has(currentUserId.toString())) {
    // Skip demo-admin parent
    if (isDemoAdminById(currentUserId.toString())) {
      break
    }

    visited.add(currentUserId.toString())

    const parent = await User.findById(currentUserId)
      .select('name role parentCoordinatorId')

    if (!parent) break

    // If volunteer and this is their direct parent, give 5% commission
    let hierarchyCommission: number
    let commissionPercentage: number

    if (isVolunteer && isFirstParent) {
      hierarchyCommission = (donationAmount * VOLUNTEER_PARENT_COMMISSION) / 100
      commissionPercentage = VOLUNTEER_PARENT_COMMISSION
      isFirstParent = false
    } else {
      hierarchyCommission = (donationAmount * HIERARCHY_COMMISSION) / 100
      commissionPercentage = HIERARCHY_COMMISSION
    }

    distributions.push({
      userId: parent._id,
      userName: parent.name,
      userRole: parent.role,
      hierarchyLevel: getHierarchyLevel(parent.role),
      commissionAmount: hierarchyCommission,
      commissionPercentage
    })

    totalCommission += hierarchyCommission

    // Move to next parent
    currentUserId = parent.parentCoordinatorId

    // Safety check: max 20 levels
    if (distributions.length >= 20) break
  }

  return { distributions, totalCommission }
}

/**
 * Create commission log entries in database
 */
export async function createCommissionLogs(
  donationId: mongoose.Types.ObjectId,
  distributions: CommissionDistribution[]
): Promise<void> {
  const commissionLogs = distributions.map(dist => ({
    donationId,
    userId: dist.userId,
    userName: dist.userName,
    userRole: dist.userRole,
    hierarchyLevel: dist.hierarchyLevel,
    commissionAmount: dist.commissionAmount,
    commissionPercentage: dist.commissionPercentage,
    status: 'PENDING' as const
  }))

  await CommissionLog.insertMany(commissionLogs)
}

/**
 * Update user's commission wallet
 */
export async function updateUserCommissionWallet(
  userId: mongoose.Types.ObjectId,
  amount: number
): Promise<void> {
  await User.findByIdAndUpdate(
    userId,
    { $inc: { commission_wallet: amount } },
    { new: true }
  )
}

/**
 * Process commission distribution for a donation
 * This is the main function to call when a donation is received
 */
export async function processCommissionDistribution(
  donationId: mongoose.Types.ObjectId,
  donatedToUserId: mongoose.Types.ObjectId | string,
  donationAmount: number
): Promise<CalculateCommissionResult> {
  // Calculate distributions
  const result = await calculateCommissionDistribution(
    donatedToUserId,
    donationAmount
  )

  // Create commission logs
  await createCommissionLogs(donationId, result.distributions)

  // Update commission wallets for all recipients
  for (const dist of result.distributions) {
    await updateUserCommissionWallet(dist.userId, dist.commissionAmount)
  }

  return result
}

/**
 * Mark commission as paid
 */
export async function markCommissionAsPaid(
  commissionLogId: mongoose.Types.ObjectId,
  transactionId: string,
  paymentMethod: string
): Promise<void> {
  await CommissionLog.findByIdAndUpdate(commissionLogId, {
    status: 'PAID',
    paidAt: new Date(),
    transactionId,
    paymentMethod
  })
}

/**
 * Get user's commission summary
 */
export async function getUserCommissionSummary(
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarned: number
  pending: number
  paid: number
  count: number
  recentCommissions: any[]
}> {
  const query: any = { userId }

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = startDate
    if (endDate) query.createdAt.$lte = endDate
  }

  const [totalResult, pendingResult, paidResult, recentCommissions] = await Promise.all([
    CommissionLog.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
    ]),
    CommissionLog.aggregate([
      { $match: { ...query, status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]),
    CommissionLog.aggregate([
      { $match: { ...query, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]),
    CommissionLog.find(query)
      .populate('donationId', 'amount donorName createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
  ])

  return {
    totalEarned: totalResult[0]?.total || 0,
    pending: pendingResult[0]?.total || 0,
    paid: paidResult[0]?.total || 0,
    count: totalResult[0]?.count || 0,
    recentCommissions
  }
}

/**
 * Get hierarchy level name from role
 */
function getHierarchyLevel(role: string): string {
  const levelMap: Record<string, string> = {
    'CENTRAL_PRESIDENT': 'National',
    'STATE_PRESIDENT': 'State',
    'STATE_COORDINATOR': 'State Coordinator',
    'ZONE_COORDINATOR': 'Zone',
    'DISTRICT_PRESIDENT': 'District President',
    'DISTRICT_COORDINATOR': 'District Coordinator',
    'BLOCK_COORDINATOR': 'Block',
    'NODAL_OFFICER': 'Nodal',
    'PRERAK': 'Prerak',
    'PRERNA_SAKHI': 'Prerna Sakhi',
    'VOLUNTEER': 'Volunteer'
  }

  return levelMap[role] || role
}

/**
 * Get organization commission summary
 */
export async function getOrganizationCommissionSummary(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalDistributed: number
  totalPending: number
  totalPaid: number
  totalCancelled: number
  commissionCount: number
  uniqueRecipients: number
}> {
  const query: any = {}

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = startDate
    if (endDate) query.createdAt.$lte = endDate
  }

  const [summary, uniqueRecipients] = await Promise.all([
    CommissionLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      }
    ]),
    CommissionLog.distinct('userId', query)
  ])

  const result = {
    totalDistributed: 0,
    totalPending: 0,
    totalPaid: 0,
    totalCancelled: 0,
    commissionCount: 0,
    uniqueRecipients: uniqueRecipients.length
  }

  summary.forEach((item: any) => {
    result.commissionCount += item.count
    result.totalDistributed += item.total

    if (item._id === 'PENDING') result.totalPending = item.total
    if (item._id === 'PAID') result.totalPaid = item.total
    if (item._id === 'CANCELLED') result.totalCancelled = item.total
  })

  return result
}

export default {
  calculateCommissionDistribution,
  createCommissionLogs,
  processCommissionDistribution,
  markCommissionAsPaid,
  getUserCommissionSummary,
  getOrganizationCommissionSummary,
  updateUserCommissionWallet
}
