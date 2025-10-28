import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  logDemoAdminAction,
  getDemoAdminAuditLogs,
  getDemoAdminAuditStats,
  clearDemoAdminAuditLogs,
  exportDemoAdminAuditLogs,
  withDemoAdminAudit,
  DemoAdminAuditActions,
  demoAdminAuditUtils
} from '../../lib/demo-admin-audit'

// Mock the demo admin functions
jest.mock('../../lib/demo-admin', () => ({
  isDemoAdmin: jest.fn(),
  isDemoAdminById: jest.fn()
}))

describe('Demo Admin Audit System', () => {
  const mockIsDemoAdmin = require('../../lib/demo-admin').isDemoAdmin as jest.MockedFunction<any>
  const mockIsDemoAdminById = require('../../lib/demo-admin').isDemoAdminById as jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    clearDemoAdminAuditLogs()

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    clearDemoAdminAuditLogs()
    jest.restoreAllMocks()
  })

  describe('logDemoAdminAction', () => {
    it('should log action for demo admin user by ID', () => {
      mockIsDemoAdminById.mockReturnValue(true)
      mockIsDemoAdmin.mockReturnValue(false)

      const result = logDemoAdminAction(
        'demo-admin',
        'admin@arpufrl.demo',
        DemoAdminAuditActions.LOGIN
      )

      expect(result).toBeDefined()
      expect(result?.userId).toBe('demo-admin')
      expect(result?.userEmail).toBe('admin@arpufrl.demo')
      expect(result?.action).toBe(DemoAdminAuditActions.LOGIN)
      expect(result?.timestamp).toBeInstanceOf(Date)
      expect(result?.id).toMatch(/^audit_/)
    })

    it('should log action for demo admin user by email', () => {
      mockIsDemoAdminById.mockReturnValue(false)
      mockIsDemoAdmin.mockReturnValue(true)

      const result = logDemoAdminAction(
        'some-id',
        'admin@arpufrl.demo',
        DemoAdminAuditActions.USER_CREATE
      )

      expect(result).toBeDefined()
      expect(result?.action).toBe(DemoAdminAuditActions.USER_CREATE)
    })

    it('should not log action for regular user', () => {
      mockIsDemoAdminById.mockReturnValue(false)
      mockIsDemoAdmin.mockReturnValue(false)

      const result = logDemoAdminAction(
        'regular-user',
        'user@example.com',
        DemoAdminAuditActions.LOGIN
      )

      expect(result).toBeNull()
    })

    it('should log action with additional details', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      const result = logDemoAdminAction(
        'demo-admin',
        'admin@arpufrl.demo',
        DemoAdminAuditActions.USER_UPDATE,
        {
          resource: 'User',
          resourceId: 'user-123',
          details: { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          sessionId: 'session-123'
        }
      )

      expect(result).toBeDefined()
      expect(result?.resource).toBe('User')
      expect(result?.resourceId).toBe('user-123')
      expect(result?.details).toEqual({
        field: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com'
      })
      expect(result?.ipAddress).toBe('192.168.1.1')
      expect(result?.userAgent).toBe('Mozilla/5.0...')
      expect(result?.sessionId).toBe('session-123')
    })

    it('should generate unique audit IDs', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      const result1 = logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)
      const result2 = logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGOUT)

      expect(result1?.id).toBeDefined()
      expect(result2?.id).toBeDefined()
      expect(result1?.id).not.toBe(result2?.id)
    })
  })

  describe('getDemoAdminAuditLogs', () => {
    beforeEach(() => {
      mockIsDemoAdminById.mockReturnValue(true)

      // Create test logs
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.USER_CREATE, {
        resource: 'User',
        resourceId: 'user-1'
      })
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.DONATION_VIEW, {
        resource: 'Donation',
        resourceId: 'donation-1'
      })
    })

    it('should return all logs without filters', () => {
      const logs = getDemoAdminAuditLogs()
      expect(logs).toHaveLength(3)
    })

    it('should filter logs by action', () => {
      const logs = getDemoAdminAuditLogs({ action: DemoAdminAuditActions.LOGIN })
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe(DemoAdminAuditActions.LOGIN)
    })

    it('should filter logs by resource', () => {
      const logs = getDemoAdminAuditLogs({ resource: 'User' })
      expect(logs).toHaveLength(1)
      expect(logs[0].resource).toBe('User')
    })

    it('should filter logs by user ID', () => {
      const logs = getDemoAdminAuditLogs({ userId: 'demo-admin' })
      expect(logs).toHaveLength(3)
    })

    it('should limit number of logs returned', () => {
      const logs = getDemoAdminAuditLogs({ limit: 2 })
      expect(logs).toHaveLength(2)
    })

    it('should apply offset for pagination', () => {
      const allLogs = getDemoAdminAuditLogs()
      const offsetLogs = getDemoAdminAuditLogs({ offset: 1, limit: 2 })

      expect(offsetLogs).toHaveLength(2)
      expect(offsetLogs[0].id).toBe(allLogs[1].id)
    })

    it('should filter logs by date range', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

      const logs = getDemoAdminAuditLogs({
        startDate: oneHourAgo,
        endDate: oneHourFromNow
      })

      expect(logs).toHaveLength(3) // All logs should be within this range
    })

    it('should return logs sorted by timestamp (newest first)', () => {
      const logs = getDemoAdminAuditLogs()

      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i].timestamp.getTime())
      }
    })
  })

  describe('getDemoAdminAuditStats', () => {
    beforeEach(() => {
      mockIsDemoAdminById.mockReturnValue(true)

      // Create test logs with different actions
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.USER_CREATE)
      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.DONATION_VIEW)
    })

    it('should return correct total log count', () => {
      const stats = getDemoAdminAuditStats()
      expect(stats.totalLogs).toBe(4)
    })

    it('should return correct action counts', () => {
      const stats = getDemoAdminAuditStats()
      expect(stats.actionCounts[DemoAdminAuditActions.LOGIN]).toBe(2)
      expect(stats.actionCounts[DemoAdminAuditActions.USER_CREATE]).toBe(1)
      expect(stats.actionCounts[DemoAdminAuditActions.DONATION_VIEW]).toBe(1)
    })

    it('should return top actions sorted by count', () => {
      const stats = getDemoAdminAuditStats()
      expect(stats.topActions[0].action).toBe(DemoAdminAuditActions.LOGIN)
      expect(stats.topActions[0].count).toBe(2)
    })

    it('should return recent activity', () => {
      const stats = getDemoAdminAuditStats()
      expect(stats.recentActivity).toHaveLength(4)
      expect(stats.recentActivity[0].timestamp).toBeInstanceOf(Date)
    })

    it('should limit recent activity to 10 entries', () => {
      // Add more logs
      for (let i = 0; i < 15; i++) {
        logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.DASHBOARD_VIEW)
      }

      const stats = getDemoAdminAuditStats()
      expect(stats.recentActivity).toHaveLength(10)
    })
  })

  describe('clearDemoAdminAuditLogs', () => {
    it('should clear all audit logs', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)
      expect(getDemoAdminAuditLogs()).toHaveLength(1)

      clearDemoAdminAuditLogs()
      expect(getDemoAdminAuditLogs()).toHaveLength(0)
    })
  })

  describe('exportDemoAdminAuditLogs', () => {
    it('should export logs as JSON string', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.LOGIN)

      const exported = exportDemoAdminAuditLogs()
      const parsed = JSON.parse(exported)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].action).toBe(DemoAdminAuditActions.LOGIN)
    })

    it('should export empty array when no logs exist', () => {
      const exported = exportDemoAdminAuditLogs()
      const parsed = JSON.parse(exported)

      expect(parsed).toEqual([])
    })
  })

  describe('withDemoAdminAudit middleware', () => {
    it('should log action for demo admin session', async () => {
      mockIsDemoAdminById.mockReturnValue(true)

      const mockHandler = jest.fn().mockResolvedValue('success')
      const auditedHandler = withDemoAdminAudit(DemoAdminAuditActions.USER_VIEW, 'User')(mockHandler)

      const mockSession = {
        user: {
          id: 'demo-admin',
          email: 'admin@arpufrl.demo',
          isDemoAccount: true
        }
      }

      await auditedHandler({ session: mockSession })

      expect(mockHandler).toHaveBeenCalled()

      const logs = getDemoAdminAuditLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe(DemoAdminAuditActions.USER_VIEW)
      expect(logs[0].userId).toBe('demo-admin')
    })

    it('should not log action for regular user session', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success')
      const auditedHandler = withDemoAdminAudit(DemoAdminAuditActions.USER_VIEW, 'User')(mockHandler)

      const mockSession = {
        user: {
          id: 'regular-user',
          email: 'user@example.com',
          isDemoAccount: false
        }
      }

      await auditedHandler({ session: mockSession })

      expect(mockHandler).toHaveBeenCalled()

      const logs = getDemoAdminAuditLogs()
      expect(logs).toHaveLength(0)
    })

    it('should not log action when no session exists', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success')
      const auditedHandler = withDemoAdminAudit(DemoAdminAuditActions.USER_VIEW, 'User')(mockHandler)

      await auditedHandler({})

      expect(mockHandler).toHaveBeenCalled()

      const logs = getDemoAdminAuditLogs()
      expect(logs).toHaveLength(0)
    })
  })

  describe('demoAdminAuditUtils', () => {
    it('should export all utility functions', () => {
      expect(typeof demoAdminAuditUtils.logDemoAdminAction).toBe('function')
      expect(typeof demoAdminAuditUtils.getDemoAdminAuditLogs).toBe('function')
      expect(typeof demoAdminAuditUtils.getDemoAdminAuditStats).toBe('function')
      expect(typeof demoAdminAuditUtils.clearDemoAdminAuditLogs).toBe('function')
      expect(typeof demoAdminAuditUtils.exportDemoAdminAuditLogs).toBe('function')
      expect(typeof demoAdminAuditUtils.withDemoAdminAudit).toBe('function')
      expect(demoAdminAuditUtils.DemoAdminAuditActions).toBeDefined()
    })

    it('should have consistent behavior with individual functions', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      const result1 = demoAdminAuditUtils.logDemoAdminAction(
        'demo-admin',
        'admin@arpufrl.demo',
        DemoAdminAuditActions.LOGIN
      )

      const result2 = logDemoAdminAction(
        'demo-admin',
        'admin@arpufrl.demo',
        DemoAdminAuditActions.LOGIN
      )

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result1?.action).toBe(result2?.action)
    })
  })

  describe('Audit Actions Constants', () => {
    it('should have all required audit action types', () => {
      const expectedActions = [
        'LOGIN', 'LOGOUT',
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW', 'USER_LIST',
        'DONATION_VIEW', 'DONATION_LIST', 'DONATION_EXPORT', 'DONATION_UPDATE',
        'PROGRAM_CREATE', 'PROGRAM_UPDATE', 'PROGRAM_DELETE', 'PROGRAM_VIEW', 'PROGRAM_LIST',
        'COORDINATOR_APPROVE', 'COORDINATOR_REJECT', 'COORDINATOR_VIEW', 'COORDINATOR_LIST',
        'DASHBOARD_VIEW', 'STATS_VIEW',
        'SYSTEM_CONFIG_VIEW', 'SYSTEM_CONFIG_UPDATE'
      ]

      expectedActions.forEach(action => {
        expect(DemoAdminAuditActions).toHaveProperty(action)
      })
    })

    it('should have string values for all actions', () => {
      Object.values(DemoAdminAuditActions).forEach(action => {
        expect(typeof action).toBe('string')
        expect(action.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Memory Management', () => {
    it('should limit audit logs to prevent memory issues', () => {
      mockIsDemoAdminById.mockReturnValue(true)

      // Add more than 1000 logs
      for (let i = 0; i < 1100; i++) {
        logDemoAdminAction('demo-admin', 'admin@arpufrl.demo', DemoAdminAuditActions.DASHBOARD_VIEW)
      }

      const logs = getDemoAdminAuditLogs({ limit: 2000 }) // Request more than stored
      expect(logs.length).toBeLessThanOrEqual(1000)
    })
  })
})