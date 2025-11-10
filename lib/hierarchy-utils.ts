/**
 * Comprehensive Hierarchy Management Utilities
 * Samarpan Sahayog Abhiyan - National to Village Level Dashboard System
 */

import { User, UserRole, UserRoleType, RoleHierarchy, RoleDisplayNames, IUser } from '@/models/User'
import mongoose from 'mongoose'

/**
 * Dashboard visibility matrix - defines what each role can view
 */
export const DashboardVisibilityMatrix: Record<UserRoleType, UserRoleType[]> = {
  // Central President can view all levels
  [UserRole.CENTRAL_PRESIDENT]: [
    UserRole.CENTRAL_PRESIDENT,
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // State President can view state downwards
  [UserRole.STATE_PRESIDENT]: [
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // State Coordinator can view zones and below
  [UserRole.STATE_COORDINATOR]: [
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Zone Coordinator can view district level and below
  [UserRole.ZONE_COORDINATOR]: [
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // District President (DP) can view district and below
  [UserRole.DISTRICT_PRESIDENT]: [
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // District Coordinator (DC) can view blocks and below
  [UserRole.DISTRICT_COORDINATOR]: [
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Block Coordinator (BC) can view nodal and below
  [UserRole.BLOCK_COORDINATOR]: [
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Nodal Officer can view panchayat level
  [UserRole.NODAL_OFFICER]: [
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Prerak can view village level
  [UserRole.PRERAK]: [
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Prerna Sakhi can view volunteers
  [UserRole.PRERNA_SAKHI]: [
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ],

  // Volunteer can view only themselves
  [UserRole.VOLUNTEER]: [
    UserRole.VOLUNTEER
  ],

  // Admin can view all
  [UserRole.ADMIN]: Object.values(UserRole) as UserRoleType[]
}

/**
 * Check if a user can view another user's dashboard
 */
export function canViewDashboard(viewerRole: UserRoleType, targetRole: UserRoleType): boolean {
  const allowedRoles = DashboardVisibilityMatrix[viewerRole] || []
  return allowedRoles.includes(targetRole)
}

/**
 * Get all subordinate roles for a given role
 */
export function getSubordinateRoles(role: UserRoleType): UserRoleType[] {
  const visibleRoles = DashboardVisibilityMatrix[role] || []
  return visibleRoles.filter(r => RoleHierarchy[r] > RoleHierarchy[role])
}

/**
 * Get immediate next level subordinates
 */
export function getImmediateSubordinateRoles(role: UserRoleType): UserRoleType[] {
  const currentLevel = RoleHierarchy[role]
  const nextLevel = currentLevel + 1

  return (Object.keys(RoleHierarchy) as UserRoleType[]).filter(
    r => RoleHierarchy[r] === nextLevel
  )
}

/**
 * Get all users in hierarchy tree starting from a user
 */
export async function getHierarchyTree(userId: mongoose.Types.ObjectId | string): Promise<any> {
  const user = await User.findById(userId).lean()
  if (!user) return null

  const buildTree = async (parentId: mongoose.Types.ObjectId): Promise<any[]> => {
    const children = await User.find({
      parentCoordinatorId: parentId,
      status: 'ACTIVE'
    })
      .select('name email role region state zone district block totalDonationsReferred totalAmountReferred')
      .lean()

    return Promise.all(
      children.map(async (child: any) => ({
        ...child,
        children: await buildTree(child._id)
      }))
    )
  }

  return {
    ...user,
    children: await buildTree(user._id)
  }
}

/**
 * Get all subordinates (flat list) for a user
 */
export async function getAllSubordinates(
  userId: mongoose.Types.ObjectId | string,
  includeIndirect: boolean = true
): Promise<IUser[]> {
  const user = await User.findById(userId)
  if (!user) return []

  if (!includeIndirect) {
    // Only direct reports
    return await User.find({
      parentCoordinatorId: userId,
      status: 'ACTIVE'
    }).lean() as any
  }

  // Get all subordinates recursively
  const subordinates: any[] = []
  const queue = [userId.toString()]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const directReports = await User.find({
      parentCoordinatorId: currentId,
      status: 'ACTIVE'
    }).lean() as any[]

    subordinates.push(...directReports)
    queue.push(...directReports.map((u: any) => u._id.toString()))
  }

  return subordinates
}

/**
 * Get hierarchy path from bottom to top
 */
export async function getHierarchyPath(userId: mongoose.Types.ObjectId | string): Promise<any[]> {
  const path: any[] = []
  let currentUser = await User.findById(userId).lean()

  while (currentUser) {
    path.unshift(currentUser)
    if (currentUser.parentCoordinatorId) {
      currentUser = await User.findById(currentUser.parentCoordinatorId).lean()
    } else {
      break
    }
  }

  return path
}

/**
 * Get dashboard statistics for a user based on their role
 */
export async function getDashboardStats(userId: mongoose.Types.ObjectId | string) {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const subordinates = await getAllSubordinates(userId, true)
  const subordinateIds = subordinates.map(s => s._id)

  // Import Donation model dynamically to avoid circular dependencies
  const { Donation } = await import('@/models/Donation')

  // Get donation statistics
  const donations = await Donation.find({
    referredBy: { $in: [userId, ...subordinateIds] },
    paymentStatus: 'SUCCESS'
  })

  const totalDonations = donations.length
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

  // Get team statistics
  const directReports = subordinates.filter(
    s => s.parentCoordinatorId?.toString() === userId.toString()
  )

  const activeMembers = subordinates.filter(s => s.status === 'ACTIVE').length
  const pendingMembers = subordinates.filter(s => s.status === 'PENDING').length

  return {
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      roleDisplay: RoleDisplayNames[user.role],
      region: user.region,
      referralCode: user.referralCode
    },
    donations: {
      total: totalDonations,
      amount: totalAmount,
      personal: user.totalDonationsReferred || 0,
      personalAmount: user.totalAmountReferred || 0
    },
    team: {
      direct: directReports.length,
      total: subordinates.length,
      active: activeMembers,
      pending: pendingMembers
    },
    hierarchy: {
      level: RoleHierarchy[user.role],
      levelName: RoleDisplayNames[user.role]
    }
  }
}

/**
 * Get team members list with pagination
 */
export async function getTeamMembers(
  userId: mongoose.Types.ObjectId | string,
  options: {
    page?: number
    limit?: number
    directOnly?: boolean
    role?: UserRoleType
    status?: string
  } = {}
) {
  const {
    page = 1,
    limit = 20,
    directOnly = false,
    role,
    status
  } = options

  let memberIds: string[]

  if (directOnly) {
    const directReports = await User.find({
      parentCoordinatorId: userId,
      status: 'ACTIVE'
    }).select('_id')
    memberIds = directReports.map(u => u._id.toString())
  } else {
    const subordinates = await getAllSubordinates(userId, true)
    memberIds = subordinates.map(s => s._id.toString())
  }

  const query: any = { _id: { $in: memberIds } }
  if (role) query.role = role
  if (status) query.status = status

  const total = await User.countDocuments(query)
  const members = await User.find(query)
    .select('name email role status region state zone district block totalDonationsReferred totalAmountReferred referralCode createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get geographical scope of a user based on their role and location
 */
export function getGeographicalScope(user: IUser): {
  level: string
  value: string | null
  canManageStates?: string[]
  canManageZones?: string[]
  canManageDistricts?: string[]
  canManageBlocks?: string[]
} {
  switch (user.role) {
    case UserRole.CENTRAL_PRESIDENT:
      return { level: 'NATIONAL', value: 'India' }

    case UserRole.STATE_PRESIDENT:
    case UserRole.STATE_COORDINATOR:
      return { level: 'STATE', value: user.state || null }

    case UserRole.ZONE_COORDINATOR:
      return { level: 'ZONE', value: user.zone || null }

    case UserRole.DISTRICT_PRESIDENT:
    case UserRole.DISTRICT_COORDINATOR:
      return { level: 'DISTRICT', value: user.district || null }

    case UserRole.BLOCK_COORDINATOR:
      return { level: 'BLOCK', value: user.block || null }

    case UserRole.NODAL_OFFICER:
      return { level: 'PANCHAYAT', value: user.panchayat || null }

    case UserRole.PRERAK:
      return { level: 'GRAM_SABHA', value: user.gramSabha || null }

    case UserRole.PRERNA_SAKHI:
      return { level: 'REVENUE_VILLAGE', value: user.revenueVillage || null }

    case UserRole.VOLUNTEER:
      return { level: 'INDIVIDUAL', value: user.revenueVillage || null }

    default:
      return { level: 'UNKNOWN', value: null }
  }
}

/**
 * Check if user can manage a specific geographical area
 */
export async function canManageGeographicalArea(
  userId: mongoose.Types.ObjectId | string,
  area: {
    state?: string
    zone?: string
    district?: string
    block?: string
    panchayat?: string
  }
): Promise<boolean> {
  const user = await User.findById(userId)
  if (!user) return false

  if (user.role === UserRole.ADMIN || user.role === UserRole.CENTRAL_PRESIDENT) {
    return true
  }

  const scope = getGeographicalScope(user)

  // Check if the area falls under user's jurisdiction
  switch (scope.level) {
    case 'STATE':
      return area.state === user.state
    case 'ZONE':
      return area.state === user.state && area.zone === user.zone
    case 'DISTRICT':
      return area.district === user.district
    case 'BLOCK':
      return area.block === user.block
    case 'PANCHAYAT':
      return area.panchayat === user.panchayat
    default:
      return false
  }
}

/**
 * Get role-specific dashboard features
 */
export function getDashboardFeatures(role: UserRoleType): {
  canViewAllStates: boolean
  canViewTeam: boolean
  canViewAnalytics: boolean
  canManageUsers: boolean
  canExportData: boolean
  canViewPaymentLinks: boolean
  canGenerateReports: boolean
  showHierarchyTree: boolean
  showPerformanceMetrics: boolean
  showRewardsSection: boolean
} {
  const hierarchyLevel = RoleHierarchy[role]

  return {
    canViewAllStates: role === UserRole.CENTRAL_PRESIDENT || role === UserRole.ADMIN,
    canViewTeam: hierarchyLevel <= 10, // All except volunteer
    canViewAnalytics: hierarchyLevel <= 8, // Up to Nodal Officer
    canManageUsers: hierarchyLevel <= 7, // Up to Block Coordinator
    canExportData: hierarchyLevel <= 5, // Up to District President
    canViewPaymentLinks: true, // All roles
    canGenerateReports: hierarchyLevel <= 6, // Up to District Coordinator
    showHierarchyTree: hierarchyLevel <= 4, // Up to Zone Coordinator
    showPerformanceMetrics: hierarchyLevel <= 9, // Up to Prerak
    showRewardsSection: true // All roles
  }
}

/**
 * Validate hierarchy assignment
 */
export async function validateHierarchyAssignment(
  userId: mongoose.Types.ObjectId | string,
  parentId: mongoose.Types.ObjectId | string
): Promise<{ valid: boolean; error?: string }> {
  const user = await User.findById(userId)
  const parent = await User.findById(parentId)

  if (!user || !parent) {
    return { valid: false, error: 'User or parent not found' }
  }

  const userLevel = RoleHierarchy[user.role]
  const parentLevel = RoleHierarchy[parent.role]

  if (parentLevel >= userLevel) {
    return {
      valid: false,
      error: 'Parent must be higher in hierarchy than user'
    }
  }

  // Check geographical consistency
  if (user.state && parent.state && user.state !== parent.state) {
    return {
      valid: false,
      error: 'User and parent must be in the same state'
    }
  }

  return { valid: true }
}

export const hierarchyUtils = {
  canViewDashboard,
  getSubordinateRoles,
  getImmediateSubordinateRoles,
  getHierarchyTree,
  getAllSubordinates,
  getHierarchyPath,
  getDashboardStats,
  getTeamMembers,
  getGeographicalScope,
  canManageGeographicalArea,
  getDashboardFeatures,
  validateHierarchyAssignment,
  RoleDisplayNames
}
