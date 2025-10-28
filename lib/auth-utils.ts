import { auth } from './auth'
import { UserRole, UserStatus, UserRoleType } from '../models/User'
import { NextRequest } from 'next/server'
import { Session } from 'next-auth'

// Type definitions for role checking
export type RequiredRole = UserRoleType | UserRoleType[]

// Authentication utilities
export const authUtils = {
  /**
   * Get current session server-side
   */
  getSession: async () => {
    return await auth()
  },

  /**
   * Check if user has required role(s)
   */
  hasRole: (userRole: string, requiredRoles: RequiredRole): boolean => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return roles.includes(userRole as UserRoleType)
  },

  /**
   * Check if user is admin
   */
  isAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },

  /**
   * Check if user is coordinator (including admin)
   */
  isCoordinator: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN || userRole === UserRole.COORDINATOR
  },

  /**
   * Check if user can access admin features
   */
  canAccessAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },

  /**
   * Check if user can access coordinator features
   */
  canAccessCoordinator: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN || userRole === UserRole.COORDINATOR || userRole === UserRole.SUB_COORDINATOR
  },

  /**
   * Check if user is active
   */
  isActiveUser: (userStatus: string): boolean => {
    return userStatus === UserStatus.ACTIVE
  },

  /**
   * Get redirect URL based on user role
   */
  getRedirectUrl: (userRole: string): string => {
    switch (userRole) {
      case UserRole.ADMIN:
        return '/dashboard/admin'
      case UserRole.COORDINATOR:
      case UserRole.SUB_COORDINATOR:
        return '/dashboard/coordinator'
      default:
        return '/'
    }
  }
}

// Higher-order function for API route protection
export function withAuth(
  handler: (request: NextRequest, session: Session) => Promise<Response>,
  options: {
    requiredRoles?: RequiredRole
    requireActive?: boolean
  } = {}
) {
  return async (request: NextRequest) => {
    try {
      const session = await auth()

      // Check if user is authenticated
      if (!session || !session.user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Check if user is active (if required)
      if (options.requireActive !== false && !authUtils.isActiveUser(session.user.status)) {
        return new Response(
          JSON.stringify({ error: 'Account is not active' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Check role requirements
      if (options.requiredRoles && !authUtils.hasRole(session.user.role, options.requiredRoles)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Call the original handler with session
      return await handler(request, session)

    } catch (error) {
      console.error('Auth middleware error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// Role-based access control decorators
export const requireAdmin = (handler: (request: NextRequest, session: Session) => Promise<Response>) =>
  withAuth(handler, { requiredRoles: UserRole.ADMIN })

export const requireCoordinator = (handler: (request: NextRequest, session: Session) => Promise<Response>) =>
  withAuth(handler, { requiredRoles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR] })

export const requireAuth = (handler: (request: NextRequest, session: Session) => Promise<Response>) =>
  withAuth(handler)

// Client-side session hooks (for use in React components)
export const sessionUtils = {
  /**
   * Check if current user has required role (client-side)
   */
  hasRole: (session: Session | null, requiredRoles: RequiredRole): boolean => {
    if (!session?.user?.role) return false
    return authUtils.hasRole(session.user.role, requiredRoles)
  },

  /**
   * Check if current user is admin (client-side)
   */
  isAdmin: (session: Session | null): boolean => {
    return session?.user?.role === UserRole.ADMIN
  },

  /**
   * Check if current user is coordinator (client-side)
   */
  isCoordinator: (session: Session | null): boolean => {
    if (!session?.user?.role) return false
    return authUtils.isCoordinator(session.user.role)
  },

  /**
   * Check if current user can access admin features (client-side)
   */
  canAccessAdmin: (session: Session | null): boolean => {
    return session?.user?.role === UserRole.ADMIN
  },

  /**
   * Check if current user can access coordinator features (client-side)
   */
  canAccessCoordinator: (session: Session | null): boolean => {
    if (!session?.user?.role) return false
    return authUtils.canAccessCoordinator(session.user.role)
  },

  /**
   * Check if current user is active (client-side)
   */
  isActiveUser: (session: Session | null): boolean => {
    return session?.user?.status === UserStatus.ACTIVE
  }
}