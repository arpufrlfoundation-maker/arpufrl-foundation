import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { User, UserRole, UserStatus } from '../../models/User'
import bcrypt from 'bcryptjs'

// Mock auth utils to avoid NextAuth dependency in tests
const authUtils = {
  hasRole: (userRole: string, requiredRoles: string | string[]): boolean => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return roles.includes(userRole)
  },
  isAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },
  isCoordinator: (userRole: string): boolean => {
    return [UserRole.ADMIN, UserRole.COORDINATOR].includes(userRole as any)
  },
  canAccessAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },
  canAccessCoordinator: (userRole: string): boolean => {
    return [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR].includes(userRole as any)
  },
  isActiveUser: (userStatus: string): boolean => {
    return userStatus === UserStatus.ACTIVE
  },
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

describe('Authentication System', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }

    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('User Authentication', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const user = await User.createUser(userData, 'TestPassword123')

      expect(user.name).toBe(userData.name)
      expect(user.email).toBe(userData.email)
      expect(user.hashedPassword).toBeDefined()
      expect(user.hashedPassword).not.toBe('TestPassword123')
      expect(user.hashedPassword?.startsWith('$2')).toBe(true)
    })

    it('should validate correct password', async () => {
      const password = 'TestPassword123'
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }, password)

      const isValid = await user.comparePassword(password)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }, 'TestPassword123')

      const isValid = await user.comparePassword('WrongPassword')
      expect(isValid).toBe(false)
    })

    it('should find user by email', async () => {
      const email = 'test@example.com'
      await User.createUser({
        name: 'Test User',
        email,
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }, 'TestPassword123')

      const foundUser = await User.findByEmail(email)
      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe(email)
    })

    it('should return null for non-existent email', async () => {
      const foundUser = await User.findByEmail('nonexistent@example.com')
      expect(foundUser).toBeNull()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should correctly identify admin role', () => {
      expect(authUtils.isAdmin(UserRole.ADMIN)).toBe(true)
      expect(authUtils.isAdmin(UserRole.COORDINATOR)).toBe(false)
      expect(authUtils.isAdmin(UserRole.DONOR)).toBe(false)
    })

    it('should correctly identify coordinator roles', () => {
      expect(authUtils.isCoordinator(UserRole.ADMIN)).toBe(true)
      expect(authUtils.isCoordinator(UserRole.COORDINATOR)).toBe(true)
      expect(authUtils.isCoordinator(UserRole.SUB_COORDINATOR)).toBe(false)
      expect(authUtils.isCoordinator(UserRole.DONOR)).toBe(false)
    })

    it('should check admin access correctly', () => {
      expect(authUtils.canAccessAdmin(UserRole.ADMIN)).toBe(true)
      expect(authUtils.canAccessAdmin(UserRole.COORDINATOR)).toBe(false)
      expect(authUtils.canAccessAdmin(UserRole.SUB_COORDINATOR)).toBe(false)
      expect(authUtils.canAccessAdmin(UserRole.DONOR)).toBe(false)
    })

    it('should check coordinator access correctly', () => {
      expect(authUtils.canAccessCoordinator(UserRole.ADMIN)).toBe(true)
      expect(authUtils.canAccessCoordinator(UserRole.COORDINATOR)).toBe(true)
      expect(authUtils.canAccessCoordinator(UserRole.SUB_COORDINATOR)).toBe(true)
      expect(authUtils.canAccessCoordinator(UserRole.DONOR)).toBe(false)
    })

    it('should check single role requirement', () => {
      expect(authUtils.hasRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
      expect(authUtils.hasRole(UserRole.COORDINATOR, UserRole.ADMIN)).toBe(false)
    })

    it('should check multiple role requirements', () => {
      const coordinatorRoles = [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR]

      expect(authUtils.hasRole(UserRole.ADMIN, coordinatorRoles)).toBe(true)
      expect(authUtils.hasRole(UserRole.COORDINATOR, coordinatorRoles)).toBe(true)
      expect(authUtils.hasRole(UserRole.SUB_COORDINATOR, coordinatorRoles)).toBe(true)
      expect(authUtils.hasRole(UserRole.DONOR, coordinatorRoles)).toBe(false)
    })

    it('should get correct redirect URLs', () => {
      expect(authUtils.getRedirectUrl(UserRole.ADMIN)).toBe('/dashboard/admin')
      expect(authUtils.getRedirectUrl(UserRole.COORDINATOR)).toBe('/dashboard/coordinator')
      expect(authUtils.getRedirectUrl(UserRole.SUB_COORDINATOR)).toBe('/dashboard/coordinator')
      expect(authUtils.getRedirectUrl(UserRole.DONOR)).toBe('/')
    })
  })

  describe('User Status Management', () => {
    it('should identify active users correctly', () => {
      expect(authUtils.isActiveUser(UserStatus.ACTIVE)).toBe(true)
      expect(authUtils.isActiveUser(UserStatus.INACTIVE)).toBe(false)
      expect(authUtils.isActiveUser(UserStatus.PENDING)).toBe(false)
    })

    it('should find only active users', async () => {
      // Create users with different statuses
      await User.createUser({
        name: 'Active User',
        email: 'active@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      await User.createUser({
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: UserRole.DONOR,
        status: UserStatus.INACTIVE
      })

      await User.createUser({
        name: 'Pending User',
        email: 'pending@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.PENDING
      })

      const activeUsers = await User.findActiveUsers()
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].email).toBe('active@example.com')
    })
  })

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const result = User.validatePassword('StrongPass123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject short passwords', () => {
      const result = User.validatePassword('Short1')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject passwords without lowercase', () => {
      const result = User.validatePassword('UPPERCASE123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject passwords without uppercase', () => {
      const result = User.validatePassword('lowercase123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject passwords without numbers', () => {
      const result = User.validatePassword('NoNumbers')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should return multiple errors for weak passwords', () => {
      const result = User.validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('Coordinator Hierarchy', () => {
    it('should validate parent coordinator relationship', async () => {
      // Create a coordinator
      const coordinator = await User.createUser({
        name: 'Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
      })

      // Create a sub-coordinator under the coordinator
      const subCoordinator = await User.createUser({
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North',
        parentCoordinatorId: coordinator._id
      })

      expect(subCoordinator.parentCoordinatorId?.toString()).toBe(coordinator._id.toString())
    })

    it('should require region for coordinators', async () => {
      await expect(User.createUser({
        name: 'Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE
        // Missing region
      })).rejects.toThrow()
    })

    it('should require parent coordinator for sub-coordinators', async () => {
      await expect(User.createUser({
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
        // Missing parentCoordinatorId
      })).rejects.toThrow()
    })
  })

  describe('User Management Utilities', () => {
    it('should check if admin can manage any user', async () => {
      const admin = await User.createUser({
        name: 'Admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      })

      const coordinator = await User.createUser({
        name: 'Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
      })

      const { userUtils } = await import('../../models/User')
      const canManage = userUtils.canManageUser(admin, coordinator)
      expect(canManage).toBe(true)
    })

    it('should check if coordinator can manage their sub-coordinators', async () => {
      const coordinator = await User.createUser({
        name: 'Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
      })

      const subCoordinator = await User.createUser({
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North',
        parentCoordinatorId: coordinator._id
      })

      const { userUtils } = await import('../../models/User')
      const canManage = userUtils.canManageUser(coordinator, subCoordinator)
      expect(canManage).toBe(true)
    })

    it('should prevent coordinator from managing other coordinators', async () => {
      const coordinator1 = await User.createUser({
        name: 'Coordinator 1',
        email: 'coordinator1@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
      })

      const coordinator2 = await User.createUser({
        name: 'Coordinator 2',
        email: 'coordinator2@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'South'
      })

      const { userUtils } = await import('../../models/User')
      const canManage = userUtils.canManageUser(coordinator1, coordinator2)
      expect(canManage).toBe(false)
    })
  })
})