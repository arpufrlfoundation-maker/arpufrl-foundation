import { UserRole, UserRoleType } from '@/models/User'

/**
 * All coordinator-level roles (excludes VOLUNTEER)
 */
export const ALL_COORDINATOR_ROLES: readonly UserRoleType[] = [
  UserRole.ADMIN,
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
] as const

/**
 * Higher-level coordinator roles that can have sub-coordinators
 */
export const PARENT_COORDINATOR_ROLES: readonly UserRoleType[] = [
  UserRole.ADMIN,
  UserRole.CENTRAL_PRESIDENT,
  UserRole.STATE_PRESIDENT,
  UserRole.STATE_COORDINATOR,
  UserRole.ZONE_COORDINATOR,
  UserRole.DISTRICT_PRESIDENT,
  UserRole.DISTRICT_COORDINATOR,
  UserRole.BLOCK_COORDINATOR,
  UserRole.NODAL_OFFICER,
  UserRole.PRERAK
] as const

/**
 * Check if a role is a coordinator role (any level)
 */
export function isCoordinatorRole(role: string): boolean {
  return ALL_COORDINATOR_ROLES.includes(role as any)
}

/**
 * Check if a role can have sub-coordinators
 */
export function canHaveSubCoordinators(role: string): boolean {
  return PARENT_COORDINATOR_ROLES.includes(role as any)
}

/**
 * Check if a user can manage another user based on hierarchy
 */
export function canManageUser(managerRole: string, targetRole: string): boolean {
  if (managerRole === UserRole.ADMIN) return true
  // Add more hierarchy logic as needed
  return false
}
