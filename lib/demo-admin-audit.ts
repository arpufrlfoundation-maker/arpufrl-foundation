import { isDemoAdminById, isDemoAdmin } from './demo-admin'

// Audit log entry interface
export interface DemoAdminAuditLog {
  id: string
  timestamp: Date
  userId: string
  userEmail: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Audit action types
export const DemoAdminAuditActions = {
  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  // User management actions
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_VIEW: 'USER_VIEW',
  USER_LIST: 'USER_LIST',

  // Donation management actions
  DONATION_VIEW: 'DONATION_VIEW',
  DONATION_LIST: 'DONATION_LIST',
  DONATION_EXPORT: 'DONATION_EXPORT',
  DONATION_UPDATE: 'DONATION_UPDATE',

  // Program management actions
  PROGRAM_CREATE: 'PROGRAM_CREATE',
  PROGRAM_UPDATE: 'PROGRAM_UPDATE',
  PROGRAM_DELETE: 'PROGRAM_DELETE',
  PROGRAM_VIEW: 'PROGRAM_VIEW',
  PROGRAM_LIST: 'PROGRAM_LIST',

  // Coordinator management actions
  COORDINATOR_APPROVE: 'COORDINATOR_APPROVE',
  COORDINATOR_REJECT: 'COORDINATOR_REJECT',
  COORDINATOR_VIEW: 'COORDINATOR_VIEW',
  COORDINATOR_LIST: 'COORDINATOR_LIST',

  // Dashboard actions
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  STATS_VIEW: 'STATS_VIEW',

  // System actions
  SYSTEM_CONFIG_VIEW: 'SYSTEM_CONFIG_VIEW',
  SYSTEM_CONFIG_UPDATE: 'SYSTEM_CONFIG_UPDATE'
} as const

export type DemoAdminAuditActionType = typeof DemoAdminAuditActions[keyof typeof DemoAdminAuditActions]

// In-memory audit log storage (for demo purposes)
// In production, this should be stored in a database or external logging service
let auditLogs: DemoAdminAuditLog[] = []

/**
 * Generate unique audit log ID
 */
const generateAuditId = (): string => {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log demo admin action
 */
export const logDemoAdminAction = (
  userId: string,
  userEmail: string,
  action: DemoAdminAuditActionType,
  options: {
    resource?: string
    resourceId?: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    sessionId?: string
  } = {}
): DemoAdminAuditLog | null => {
  // Only log if user is demo admin
  if (!isDemoAdminById(userId) && !isDemoAdmin(userEmail)) {
    return null
  }

  const auditEntry: DemoAdminAuditLog = {
    id: generateAuditId(),
    timestamp: new Date(),
    userId,
    userEmail,
    action,
    resource: options.resource,
    resourceId: options.resourceId,
    details: options.details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    sessionId: options.sessionId
  }

  // Add to in-memory storage
  auditLogs.push(auditEntry)

  // Keep only last 1000 entries to prevent memory issues
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(-1000)
  }

  // Log to console for development
  console.log('Demo Admin Audit Log:', {
    id: auditEntry.id,
    timestamp: auditEntry.timestamp.toISOString(),
    user: `${auditEntry.userEmail} (${auditEntry.userId})`,
    action: auditEntry.action,
    resource: auditEntry.resource,
    resourceId: auditEntry.resourceId,
    details: auditEntry.details
  })

  return auditEntry
}

/**
 * Get demo admin audit logs
 */
export const getDemoAdminAuditLogs = (options: {
  userId?: string
  action?: DemoAdminAuditActionType
  resource?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
} = {}): DemoAdminAuditLog[] => {
  let filteredLogs = [...auditLogs]

  // Filter by user ID
  if (options.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === options.userId)
  }

  // Filter by action
  if (options.action) {
    filteredLogs = filteredLogs.filter(log => log.action === options.action)
  }

  // Filter by resource
  if (options.resource) {
    filteredLogs = filteredLogs.filter(log => log.resource === options.resource)
  }

  // Filter by date range
  if (options.startDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= options.startDate!)
  }

  if (options.endDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= options.endDate!)
  }

  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Apply pagination
  const offset = options.offset || 0
  const limit = options.limit || 100

  return filteredLogs.slice(offset, offset + limit)
}

/**
 * Get demo admin audit log statistics
 */
export const getDemoAdminAuditStats = (): {
  totalLogs: number
  actionCounts: Record<string, number>
  recentActivity: DemoAdminAuditLog[]
  topActions: Array<{ action: string; count: number }>
} => {
  const actionCounts: Record<string, number> = {}

  // Count actions
  auditLogs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  // Get top actions
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Get recent activity (last 10 entries)
  const recentActivity = auditLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)

  return {
    totalLogs: auditLogs.length,
    actionCounts,
    recentActivity,
    topActions
  }
}

/**
 * Clear demo admin audit logs (for testing/cleanup)
 */
export const clearDemoAdminAuditLogs = (): void => {
  auditLogs = []
  console.log('Demo admin audit logs cleared')
}

/**
 * Export demo admin audit logs (for backup/analysis)
 */
export const exportDemoAdminAuditLogs = (): string => {
  return JSON.stringify(auditLogs, null, 2)
}

/**
 * Middleware function to automatically log demo admin actions
 */
export const withDemoAdminAudit = <T extends (...args: any[]) => any>(
  action: DemoAdminAuditActionType,
  resource?: string
) => {
  return (handler: T) => {
    return (async (...args: Parameters<T>) => {
      // Extract session/user info from request context
      // This is a simplified version - in practice, you'd extract from NextAuth session
      const session = args[0]?.session || args[1]?.session

      if (session?.user?.isDemoAccount) {
        const auditOptions: any = {
          resource,
          details: {
            args: args.length > 0 ? 'Request processed' : undefined
          }
        }

        // Extract IP and user agent if available from request
        if (args[0]?.headers) {
          auditOptions.ipAddress = args[0].headers.get('x-forwarded-for') ||
            args[0].headers.get('x-real-ip') ||
            'unknown'
          auditOptions.userAgent = args[0].headers.get('user-agent') || 'unknown'
        }

        logDemoAdminAction(
          session.user.id,
          session.user.email,
          action,
          auditOptions
        )
      }

      // Call original handler
      return await handler(...args)
    }) as T
  }
}

// Demo admin audit utilities
export const demoAdminAuditUtils = {
  logDemoAdminAction,
  getDemoAdminAuditLogs,
  getDemoAdminAuditStats,
  clearDemoAdminAuditLogs,
  exportDemoAdminAuditLogs,
  withDemoAdminAudit,
  DemoAdminAuditActions
}