import { describe, it, expect } from '@jest/globals'
import { authUtils, sessionUtils } from '../../lib/auth-utils'
import { UserRole, UserStatus } from '../../models/User'
import { Session } from 'next-auth'

describe('Authentication Utilities', () => {
  describe('authUtils', () => {
    describe('hasRole', () => {
      it('should return true for matching single role', () => {
        expect(authUtils.hasRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
        expect(authUtils.hasRole(UserRole.COORDINATOR, UserRole.COORDINATOR)).toBe(true)
      })

      it('should return false for non-matching single role', () => {
        expect(authUtils.hasRole(UserRole.DONOR, UserRole.ADMIN)).toBe(false)
        expect(authUtils.hasRole(UserRole.COORDINATOR, UserRole.ADMIN)).toBe(false)
      })

      it('should return true for matching role in array', () => {
        const coordinatorRoles = [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]

        expect(authUtils.hasRole(UserRole.ADMIN, coordinatorRoles)).toBe(true)
        expect(authUtils.hasRole(UserRole.COORDINATOR, coordinatorRoles)).toBe(true)
        expect(authUtils.hasRole(UserRole.SUB_COORDINATOR, coordinatorRoles)).toBe(true)
      })

      it('should return false for non-matching role in array', () => {
        const coordinatorRoles = [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]

        expect(authUtils.hasRole(UserRole.DONOR, coordinatorRoles)).toBe(false)
      })
    })

    describe('isAdmin', () => {
      it('should return true only for admin role', () => {
        expect(authUtils.isAdmin(UserRole.ADMIN)).toBe(true)
        expect(authUtils.isAdmin(UserRole.COORDINATOR)).toBe(false)
        expect(authUtils.isAdmin(UserRole.SUB_COORDINATOR)).toBe(false)
        expect(authUtils.isAdmin(UserRole.DONOR)).toBe(false)
      })
    })

    describe('isCoordinator', () => {
      it('should return true for admin and coordinator roles', () => {
        expect(authUtils.isCoordinator(UserRole.ADMIN)).toBe(true)
        expect(authUtils.isCoordinator(UserRole.COORDINATOR)).toBe(true)
        expect(authUtils.isCoordinator(UserRole.SUB_COORDINATOR)).toBe(false)
        expect(authUtils.isCoordinator(UserRole.DONOR)).toBe(false)
      })
    })

    describe('canAccessAdmin', () => {
      it('should return true only for admin role', () => {
        expect(authUtils.canAccessAdmin(UserRole.ADMIN)).toBe(true)
        expect(authUtils.canAccessAdmin(UserRole.COORDINATOR)).toBe(false)
        expect(authUtils.canAccessAdmin(UserRole.SUB_COORDINATOR)).toBe(false)
        expect(authUtils.canAccessAdmin(UserRole.DONOR)).toBe(false)
      })
    })

    describe('canAccessCoordinator', () => {
      it('should return true for coordinator-level roles', () => {
        expect(authUtils.canAccessCoordinator(UserRole.ADMIN)).toBe(true)
        expect(authUtils.canAccessCoordinator(UserRole.COORDINATOR)).toBe(true)
        expect(authUtils.canAccessCoordinator(UserRole.SUB_COORDINATOR)).toBe(true)
        expect(authUtils.canAccessCoordinator(UserRole.DONOR)).toBe(false)
      })
    })

    describe('isActiveUser', () => {
      it('should return true only for active status', () => {
        expect(authUtils.isActiveUser(UserStatus.ACTIVE)).toBe(true)
        expect(authUtils.isActiveUser(UserStatus.INACTIVE)).toBe(false)
        expect(authUtils.isActiveUser(UserStatus.PENDING)).toBe(false)
      })
    })

    describe('getRedirectUrl', () => {
      it('should return correct URLs for each role', () => {
        expect(authUtils.getRedirectUrl(UserRole.ADMIN)).toBe('/dashboard/admin')
        expect(authUtils.getRedirectUrl(UserRole.COORDINATOR)).toBe('/dashboard/coordinator')
        expect(authUtils.getRedirectUrl(UserRole.SUB_COORDINATOR)).toBe('/dashboard/coordinator')
        expect(authUtils.getRedirectUrl(UserRole.DONOR)).toBe('/')
      })
    })
  })

  describe('sessionUtils', () => {
    const createMockSession = (role: string, status: string = UserStatus.ACTIVE): Session => ({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role,
        status
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

    describe('hasRole', () => {
      it('should return true for matching role with valid session', () => {
        const session = createMockSession(UserRole.ADMIN)
        expect(sessionUtils.hasRole(session, UserRole.ADMIN)).toBe(true)
      })

      it('should return false for non-matching role', () => {
        const session = createMockSession(UserRole.DONOR)
        expect(sessionUtils.hasRole(session, UserRole.ADMIN)).toBe(false)
      })

      it('should return false for null session', () => {
        expect(sessionUtils.hasRole(null, UserRole.ADMIN)).toBe(false)
      })

      it('should work with role arrays', () => {
        const session = createMockSession(UserRole.COORDINATOR)
        const coordinatorRoles = [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]

        expect(sessionUtils.hasRole(session, coordinatorRoles)).toBe(true)
      })
    })

    describe('isAdmin', () => {
      it('should return true for admin session', () => {
        const session = createMockSession(UserRole.ADMIN)
        expect(sessionUtils.isAdmin(session)).toBe(true)
      })

      it('should return false for non-admin session', () => {
        const session = createMockSession(UserRole.COORDINATOR)
        expect(sessionUtils.isAdmin(session)).toBe(false)
      })

      it('should return false for null session', () => {
        expect(sessionUtils.isAdmin(null)).toBe(false)
      })
    })

    describe('isCoordinator', () => {
      it('should return true for coordinator-level sessions', () => {
        expect(sessionUtils.isCoordinator(createMockSession(UserRole.ADMIN))).toBe(true)
        expect(sessionUtils.isCoordinator(createMockSession(UserRole.COORDINATOR))).toBe(true)
        expect(sessionUtils.isCoordinator(createMockSession(UserRole.SUB_COORDINATOR))).toBe(false)
        expect(sessionUtils.isCoordinator(createMockSession(UserRole.DONOR))).toBe(false)
      })

      it('should return false for null session', () => {
        expect(sessionUtils.isCoordinator(null)).toBe(false)
      })
    })

    describe('canAccessAdmin', () => {
      it('should return true only for admin session', () => {
        expect(sessionUtils.canAccessAdmin(createMockSession(UserRole.ADMIN))).toBe(true)
        expect(sessionUtils.canAccessAdmin(createMockSession(UserRole.COORDINATOR))).toBe(false)
        expect(sessionUtils.canAccessAdmin(null)).toBe(false)
      })
    })

    describe('canAccessCoordinator', () => {
      it('should return true for coordinator-level sessions', () => {
        expect(sessionUtils.canAccessCoordinator(createMockSession(UserRole.ADMIN))).toBe(true)
        expect(sessionUtils.canAccessCoordinator(createMockSession(UserRole.COORDINATOR))).toBe(true)
        expect(sessionUtils.canAccessCoordinator(createMockSession(UserRole.SUB_COORDINATOR))).toBe(true)
        expect(sessionUtils.canAccessCoordinator(createMockSession(UserRole.DONOR))).toBe(false)
        expect(sessionUtils.canAccessCoordinator(null)).toBe(false)
      })
    })

    describe('isActiveUser', () => {
      it('should return true for active user session', () => {
        const session = createMockSession(UserRole.DONOR, UserStatus.ACTIVE)
        expect(sessionUtils.isActiveUser(session)).toBe(true)
      })

      it('should return false for inactive user session', () => {
        const session = createMockSession(UserRole.DONOR, UserStatus.INACTIVE)
        expect(sessionUtils.isActiveUser(session)).toBe(false)
      })

      it('should return false for pending user session', () => {
        const session = createMockSession(UserRole.DONOR, UserStatus.PENDING)
        expect(sessionUtils.isActiveUser(session)).toBe(false)
      })

      it('should return false for null session', () => {
        expect(sessionUtils.isActiveUser(null)).toBe(false)
      })
    })
  })

  describe('withAuth HOF', () => {
    const { withAuth } = require('../../lib/auth-utils')

    // Mock auth function
    jest.mock('../../lib/auth', () => ({
      auth: jest.fn()
    }))

    const mockHandler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )

    const mockRequest = {} as any

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should call handler with valid session', async () => {
      const mockSession = createMockSession(UserRole.ADMIN)
      const { auth } = require('../../lib/auth')
      auth.mockResolvedValue(mockSession)

      const protectedHandler = withAuth(mockHandler)
      const response = await protectedHandler(mockRequest)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockSession)
      expect(response.status).toBe(200)
    })

    it('should return 401 for missing session', async () => {
      const { auth } = require('../../lib/auth')
      auth.mockResolvedValue(null)

      const protectedHandler = withAuth(mockHandler)
      const response = await protectedHandler(mockRequest)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
    })

    it('should return 403 for insufficient role', async () => {
      const mockSession = createMockSession(UserRole.DONOR)
      const { auth } = require('../../lib/auth')
      auth.mockResolvedValue(mockSession)

      const protectedHandler = withAuth(mockHandler, { requiredRoles: UserRole.ADMIN })
      const response = await protectedHandler(mockRequest)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
    })

    it('should return 403 for inactive user', async () => {
      const mockSession = createMockSession(UserRole.ADMIN, UserStatus.INACTIVE)
      const { auth } = require('../../lib/auth')
      auth.mockResolvedValue(mockSession)

      const protectedHandler = withAuth(mockHandler, { requireActive: true })
      const response = await protectedHandler(mockRequest)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
    })
  })
})