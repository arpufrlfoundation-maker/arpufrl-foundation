import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  getDemoAdminConfig,
  validateDemoAdminCredentials,
  isDemoAdmin,
  isDemoAdminById,
  getDemoAdminUser,
  getDemoAdminSession,
  validateDemoAdminConfig,
  demoAdminUtils
} from '../../lib/demo-admin'
import { UserRole, UserStatus } from '../../models/User'

describe('Demo Admin Configuration System', () => {
  // Store original environment variables
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv }
    delete process.env.DEMO_ADMIN_EMAIL
    delete process.env.DEMO_ADMIN_PASSWORD
    delete process.env.DEMO_ADMIN_NAME
  })

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv
  })

  describe('getDemoAdminConfig', () => {
    it('should return fallback configuration when no environment variables are set', () => {
      const config = getDemoAdminConfig()

      expect(config).toEqual({
        email: 'admin@arpufrl.demo',
        password: 'DemoAdmin@2025',
        name: 'Demo Administrator',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isDemoAccount: true
      })
    })

    it('should use environment variables when available', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'CustomPass123'
      process.env.DEMO_ADMIN_NAME = 'Custom Admin'

      const config = getDemoAdminConfig()

      expect(config).toEqual({
        email: 'custom@admin.com',
        password: 'CustomPass123',
        name: 'Custom Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isDemoAccount: true
      })
    })

    it('should use default name when environment name is not provided', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'CustomPass123'
      // DEMO_ADMIN_NAME not set

      const config = getDemoAdminConfig()

      expect(config.name).toBe('Demo Administrator')
      expect(config.email).toBe('custom@admin.com')
      expect(config.password).toBe('CustomPass123')
    })

    it('should fallback to hard-coded values when only email is set', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      // DEMO_ADMIN_PASSWORD not set

      const config = getDemoAdminConfig()

      // Should use fallback since password is missing
      expect(config).toEqual({
        email: 'admin@arpufrl.demo',
        password: 'DemoAdmin@2025',
        name: 'Demo Administrator',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isDemoAccount: true
      })
    })
  })

  describe('validateDemoAdminCredentials', () => {
    it('should validate correct fallback credentials', () => {
      const isValid = validateDemoAdminCredentials('admin@arpufrl.demo', 'DemoAdmin@2025')
      expect(isValid).toBe(true)
    })

    it('should validate correct environment credentials', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'CustomPass123'

      const isValid = validateDemoAdminCredentials('custom@admin.com', 'CustomPass123')
      expect(isValid).toBe(true)
    })

    it('should reject incorrect email', () => {
      const isValid = validateDemoAdminCredentials('wrong@email.com', 'DemoAdmin@2025')
      expect(isValid).toBe(false)
    })

    it('should reject incorrect password', () => {
      const isValid = validateDemoAdminCredentials('admin@arpufrl.demo', 'WrongPassword')
      expect(isValid).toBe(false)
    })

    it('should reject both incorrect email and password', () => {
      const isValid = validateDemoAdminCredentials('wrong@email.com', 'WrongPassword')
      expect(isValid).toBe(false)
    })
  })

  describe('isDemoAdmin', () => {
    it('should identify demo admin email correctly with fallback config', () => {
      expect(isDemoAdmin('admin@arpufrl.demo')).toBe(true)
      expect(isDemoAdmin('regular@user.com')).toBe(false)
    })

    it('should identify demo admin email correctly with environment config', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'CustomPass123'

      expect(isDemoAdmin('custom@admin.com')).toBe(true)
      expect(isDemoAdmin('admin@arpufrl.demo')).toBe(false)
      expect(isDemoAdmin('regular@user.com')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(isDemoAdmin('ADMIN@ARPUFRL.DEMO')).toBe(false)
      expect(isDemoAdmin('Admin@Arpufrl.Demo')).toBe(false)
    })
  })

  describe('isDemoAdminById', () => {
    it('should identify demo admin ID correctly', () => {
      expect(isDemoAdminById('demo-admin')).toBe(true)
      expect(isDemoAdminById('regular-user-id')).toBe(false)
      expect(isDemoAdminById('admin')).toBe(false)
      expect(isDemoAdminById('')).toBe(false)
    })
  })

  describe('getDemoAdminUser', () => {
    it('should return correct user object with fallback config', () => {
      const user = getDemoAdminUser()

      expect(user).toEqual({
        id: 'demo-admin',
        name: 'Demo Administrator',
        email: 'admin@arpufrl.demo',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isDemoAccount: true
      })
    })

    it('should return correct user object with environment config', () => {
      process.env.DEMO_ADMIN_EMAIL = 'custom@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'CustomPass123'
      process.env.DEMO_ADMIN_NAME = 'Custom Admin'

      const user = getDemoAdminUser()

      expect(user).toEqual({
        id: 'demo-admin',
        name: 'Custom Admin',
        email: 'custom@admin.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isDemoAccount: true
      })
    })
  })

  describe('getDemoAdminSession', () => {
    it('should return correct session object', () => {
      const session = getDemoAdminSession()

      expect(session).toEqual({
        user: {
          id: 'demo-admin',
          name: 'Demo Administrator',
          email: 'admin@arpufrl.demo',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isDemoAccount: true
        }
      })
    })
  })

  describe('validateDemoAdminConfig', () => {
    it('should validate correct fallback configuration', () => {
      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate correct environment configuration', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'ValidPass123'
      process.env.DEMO_ADMIN_NAME = 'Valid Admin'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject invalid email format', () => {
      process.env.DEMO_ADMIN_EMAIL = 'invalid-email'
      process.env.DEMO_ADMIN_PASSWORD = 'ValidPass123'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin email format is invalid')
    })

    it('should reject short password', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'Short1'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin password must be at least 8 characters')
    })

    it('should reject weak password without uppercase', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'lowercase123'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin password must contain uppercase, lowercase, and number')
    })

    it('should reject weak password without lowercase', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'UPPERCASE123'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin password must contain uppercase, lowercase, and number')
    })

    it('should reject weak password without numbers', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'NoNumbers'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin password must contain uppercase, lowercase, and number')
    })

    it('should reject empty or short name', () => {
      process.env.DEMO_ADMIN_EMAIL = 'valid@admin.com'
      process.env.DEMO_ADMIN_PASSWORD = 'ValidPass123'
      process.env.DEMO_ADMIN_NAME = 'A'

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Demo admin name must be at least 2 characters')
    })

    it('should return multiple errors for multiple issues', () => {
      process.env.DEMO_ADMIN_EMAIL = 'invalid-email'
      process.env.DEMO_ADMIN_PASSWORD = 'weak'
      // Don't set DEMO_ADMIN_NAME to test the fallback behavior

      const validation = validateDemoAdminConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(1)
      expect(validation.errors).toContain('Demo admin email format is invalid')
      expect(validation.errors).toContain('Demo admin password must be at least 8 characters')
      expect(validation.errors).toContain('Demo admin password must contain uppercase, lowercase, and number')
    })
  })

  describe('demoAdminUtils', () => {
    it('should export all utility functions', () => {
      expect(typeof demoAdminUtils.getDemoAdminConfig).toBe('function')
      expect(typeof demoAdminUtils.validateDemoAdminCredentials).toBe('function')
      expect(typeof demoAdminUtils.isDemoAdmin).toBe('function')
      expect(typeof demoAdminUtils.isDemoAdminById).toBe('function')
      expect(typeof demoAdminUtils.getDemoAdminUser).toBe('function')
      expect(typeof demoAdminUtils.getDemoAdminSession).toBe('function')
      expect(typeof demoAdminUtils.validateDemoAdminConfig).toBe('function')
      expect(typeof demoAdminUtils.logDemoAdminStatus).toBe('function')
    })

    it('should have consistent behavior with individual functions', () => {
      const email = 'admin@arpufrl.demo'
      const password = 'DemoAdmin@2025'

      expect(demoAdminUtils.isDemoAdmin(email)).toBe(isDemoAdmin(email))
      expect(demoAdminUtils.validateDemoAdminCredentials(email, password))
        .toBe(validateDemoAdminCredentials(email, password))
      expect(demoAdminUtils.isDemoAdminById('demo-admin')).toBe(isDemoAdminById('demo-admin'))
    })
  })
})