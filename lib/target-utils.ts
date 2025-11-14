/**
 * Target Utilities
 * Helper functions for target management and calculations
 */

import Target, { ITarget, HierarchyLevel } from '@/models/Target'
import { User, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'

/**
 * Map user role to hierarchy level
 */
export function mapRoleToHierarchy(role: string): string {
  const mapping: Record<string, string> = {
    'CENTRAL_PRESIDENT': HierarchyLevel.NATIONAL,
    'STATE_PRESIDENT': HierarchyLevel.STATE,
    'STATE_COORDINATOR': HierarchyLevel.STATE_COORD,
    'ZONE_COORDINATOR': HierarchyLevel.ZONE,
    'DISTRICT_PRESIDENT': HierarchyLevel.DISTRICT_PRES,
    'DISTRICT_COORDINATOR': HierarchyLevel.DISTRICT_COORD,
    'BLOCK_COORDINATOR': HierarchyLevel.BLOCK,
    'NODAL_OFFICER': HierarchyLevel.NODAL,
    'PRERAK': HierarchyLevel.PRERAK,
    'PRERNA_SAKHI': HierarchyLevel.PRERNA,
    'VOLUNTEER': HierarchyLevel.VOLUNTEER,
    'ADMIN': HierarchyLevel.NATIONAL
  }

  return mapping[role] || HierarchyLevel.VOLUNTEER
}

/**
 * Check if a user can assign targets to another user
 */
export async function canAssignTarget(
  assignerId: mongoose.Types.ObjectId,
  targetUserId: mongoose.Types.ObjectId
): Promise<{ canAssign: boolean; reason?: string }> {
  const assigner = await User.findById(assignerId).select('role')
  const targetUser = await User.findById(targetUserId).select('role')

  if (!assigner || !targetUser) {
    return { canAssign: false, reason: 'User not found' }
  }

  // Admin can assign to anyone
  if (assigner.role === 'ADMIN') {
    return { canAssign: true }
  }

  // Check hierarchy level
  const assignerLevel = RoleHierarchy[assigner.role]
  const targetLevel = RoleHierarchy[targetUser.role]

  if (assignerLevel >= targetLevel) {
    return {
      canAssign: false,
      reason: 'You can only assign targets to subordinates'
    }
  }

  return { canAssign: true }
}

/**
 * Calculate total collection for a user (personal + team)
 */
export async function calculateTotalCollection(
  userId: mongoose.Types.ObjectId
): Promise<{ personal: number; team: number; total: number }> {
  const activeTarget = await Target.findActiveByUser(userId)

  if (!activeTarget) {
    return { personal: 0, team: 0, total: 0 }
  }

  return {
    personal: activeTarget.personalCollection,
    team: activeTarget.teamCollection,
    total: activeTarget.totalCollection
  }
}

/**
 * Get target progress summary
 */
export async function getTargetProgress(userId: mongoose.Types.ObjectId) {
  const activeTarget = await Target.findActiveByUser(userId)

  if (!activeTarget) {
    return {
      hasActiveTarget: false,
      targetAmount: 0,
      collected: 0,
      remaining: 0,
      percentage: 0,
      status: 'NO_TARGET'
    }
  }

  return {
    hasActiveTarget: true,
    targetAmount: activeTarget.targetAmount,
    collected: activeTarget.totalCollection,
    remaining: activeTarget.remainingAmount,
    percentage: activeTarget.progressPercentage,
    status: activeTarget.status,
    daysRemaining: activeTarget.daysRemaining,
    isOverdue: activeTarget.isOverdue
  }
}

/**
 * Recalculate team collection from all subordinates
 */
export async function recalculateTeamCollection(
  userId: mongoose.Types.ObjectId
): Promise<number> {
  // Get all direct subordinates
  const subordinates = await User.find({ parentCoordinatorId: userId }).select('_id')

  if (subordinates.length === 0) return 0

  // Get all their targets and sum total collections
  const targets = await Target.find({
    assignedTo: { $in: subordinates.map(s => s._id) },
    status: { $ne: 'CANCELLED' }
  })

  const teamCollection = targets.reduce((sum, target) => sum + target.totalCollection, 0)

  // Update current user's target
  const userTarget = await Target.findActiveByUser(userId)
  if (userTarget) {
    userTarget.teamCollection = teamCollection
    await userTarget.save()
  }

  return teamCollection
}

/**
 * Propagate collection update through entire hierarchy chain
 */
export async function propagateCollectionChain(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const user = await User.findById(userId).select('parentCoordinatorId')

  if (!user || !user.parentCoordinatorId) {
    return // Reached top of hierarchy
  }

  // Recalculate parent's team collection
  await recalculateTeamCollection(user.parentCoordinatorId)

  // Continue propagating upward
  await propagateCollectionChain(user.parentCoordinatorId)
}

/**
 * Get team performance breakdown
 */
export async function getTeamPerformance(userId: mongoose.Types.ObjectId) {
  const subordinates = await User.find({ parentCoordinatorId: userId })
    .select('_id name role state district')

  if (subordinates.length === 0) {
    return {
      teamSize: 0,
      activeMembers: 0,
      totalTeamCollection: 0,
      averageCollection: 0,
      members: []
    }
  }

  const targets = await Target.find({
    assignedTo: { $in: subordinates.map(s => s._id) },
    status: { $ne: 'CANCELLED' }
  })

  const members = subordinates.map(sub => {
    const target = targets.find(t => t.assignedTo.toString() === sub._id.toString())
    return {
      userId: sub._id,
      name: sub.name,
      role: sub.role,
      state: sub.state,
      district: sub.district,
      targetAmount: target?.targetAmount || 0,
      personalCollection: target?.personalCollection || 0,
      teamCollection: target?.teamCollection || 0,
      totalCollection: target?.totalCollection || 0,
      progressPercentage: target?.progressPercentage || 0,
      status: target?.status || 'NO_TARGET'
    }
  })

  const totalTeamCollection = targets.reduce((sum, t) => sum + t.totalCollection, 0)
  const activeMembers = targets.filter(t => t.status !== 'CANCELLED' && t.status !== 'COMPLETED').length

  return {
    teamSize: subordinates.length,
    activeMembers,
    totalTeamCollection,
    averageCollection: subordinates.length > 0 ? totalTeamCollection / subordinates.length : 0,
    members: members.sort((a, b) => b.totalCollection - a.totalCollection)
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Get target status color for UI
 */
export function getTargetStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'gray',
    'IN_PROGRESS': 'blue',
    'COMPLETED': 'green',
    'OVERDUE': 'red',
    'CANCELLED': 'gray'
  }
  return colors[status] || 'gray'
}

/**
 * Get target status label
 */
export function getTargetStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'OVERDUE': 'Overdue',
    'CANCELLED': 'Cancelled'
  }
  return labels[status] || status
}

/**
 * Calculate days remaining
 */
export function calculateDaysRemaining(endDate: Date): number {
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if target is overdue
 */
export function isTargetOverdue(endDate: Date, status: string): boolean {
  return calculateDaysRemaining(endDate) < 0 && status !== 'COMPLETED' && status !== 'CANCELLED'
}

/**
 * Get progress status text
 */
export function getProgressStatus(percentage: number, isOverdue: boolean): string {
  if (isOverdue) return 'Overdue'
  if (percentage >= 100) return 'Completed'
  if (percentage >= 75) return 'On Track'
  if (percentage >= 50) return 'Moderate'
  if (percentage >= 25) return 'Slow'
  return 'Very Slow'
}

/**
 * Validate target assignment request
 */
export function validateTargetAssignment(data: {
  targetAmount: number
  startDate: Date
  endDate: Date
  subdivisions?: { userId: string; amount: number }[]
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.targetAmount || data.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0')
  }

  if (data.targetAmount > 100000000) {
    errors.push('Target amount is too large (max: ₹10 crore)')
  }

  if (!data.startDate) {
    errors.push('Start date is required')
  }

  if (!data.endDate) {
    errors.push('End date is required')
  }

  if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push('End date must be after start date')
  }

  if (data.subdivisions && data.subdivisions.length > 0) {
    const totalSubdivision = data.subdivisions.reduce((sum, sub) => sum + sub.amount, 0)
    if (totalSubdivision > data.targetAmount) {
      errors.push('Total subdivisions exceed target amount')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  mapRoleToHierarchy,
  canAssignTarget,
  calculateTotalCollection,
  getTargetProgress,
  recalculateTeamCollection,
  propagateCollectionChain,
  getTeamPerformance,
  formatCurrency,
  formatPercentage,
  getTargetStatusColor,
  getTargetStatusLabel,
  calculateDaysRemaining,
  isTargetOverdue,
  getProgressStatus,
  validateTargetAssignment
}
