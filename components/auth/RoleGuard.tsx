'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { sessionUtils } from '../../lib/auth-utils'
import { UserRole, UserRoleType } from '../../models/User'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles?: UserRoleType | UserRoleType[]
  fallback?: ReactNode
  requireActive?: boolean
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard({
  children,
  requiredRoles,
  fallback = null,
  requireActive = true
}: RoleGuardProps) {
  const { data: session, status } = useSession()

  // Show loading state
  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>
  }

  // Check if user is authenticated
  if (!session) {
    return <>{fallback}</>
  }

  // Check if user is active (if required)
  if (requireActive && !sessionUtils.isActiveUser(session)) {
    return <>{fallback}</>
  }

  // Check role requirements
  if (requiredRoles && !sessionUtils.hasRole(session, requiredRoles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Component that only renders for admin users
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRoles={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component that only renders for coordinators (including admins)
 */
export function CoordinatorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Component that only renders for authenticated users
 */
export function AuthOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!session) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Component that only renders for unauthenticated users
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>
  }

  if (session) {
    return null
  }

  return <>{children}</>
}