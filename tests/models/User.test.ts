import { User, UserRole, UserStatus, userUtils } from '../../models/User'
import mongoose from 'mongoose'

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const user = new User(userData)
      await user.save()

      expect(user.name).toBe('John Doe')
      expect(user.email).toBe('john@example.com')
      expect(user.role).toBe(UserRole.DONOR)
      expect(user.status).toBe(UserStatus.ACTIVE)
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()
    })

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      await new User(userData).save()

      // Try to create another user with same email
      const duplicateUser = new User({
        ...userData,
        name: 'Jane Doe'
      })

      await expect(duplicateUser.save()).rejects.toThrow()
    })

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const user = new User(userData)
      await expect(user.save()).rejects.toThrow()
    })

    it('should validate name format', async () => {
      const userData = {
        name: 'J', // Too short
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const user = new User(userData)
      await expect(user.save()).rejects.toThrow()
    })

    it('should require region for coordinators', async () => {
      const userData = {
        name: 'John Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE
        // Missing region
      }

      const user = new User(userData)
      await expect(user.save()).rejects.toThrow()
    })

    it('should require parent coordinator for sub-coordinators', async () => {
      const userData = {
        name: 'John Sub',
        email: 'sub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Mumbai'
        // Missing parentCoordinatorId
      }

      const user = new User(userData)
      await expect(user.save()).rejects.toThrow()
    })
  })

  describe('Password Hashing', () => {
    it('should hash password when set', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      await user.hashPassword('password123')
      await user.save()

      expect(user.hashedPassword).toBeDefined()
      expect(user.hashedPassword).not.toBe('password123')
    })

    it('should compare passwords correctly', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      await user.hashPassword('password123')
      await user.save()

      const isValid = await user.comparePassword('password123')
      const isInvalid = await user.comparePassword('wrongpassword')

      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })
  })

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        {
          name: 'Admin User',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          region: 'Mumbai'
        },
        {
          name: 'Coordinator User',
          email: 'coordinator@example.com',
          role: UserRole.COORDINATOR,
          status: UserStatus.ACTIVE,
          region: 'Delhi'
        },
        {
          name: 'Donor User',
          email: 'donor@example.com',
          role: UserRole.DONOR,
          status: UserStatus.INACTIVE
        }
      ])
    })

    it('should find user by email', async () => {
      const user = await User.findByEmail('admin@example.com')

      expect(user).toBeDefined()
      expect(user?.name).toBe('Admin User')
      expect(user?.email).toBe('admin@example.com')
    })

    it('should find users by role', async () => {
      const coordinators = await User.findByRole(UserRole.COORDINATOR)

      expect(coordinators).toHaveLength(1)
      expect(coordinators[0].name).toBe('Coordinator User')
    })

    it('should find active users only', async () => {
      const activeUsers = await User.findActiveUsers()

      expect(activeUsers).toHaveLength(2) // Admin and Coordinator
      expect(activeUsers.every(user => user.status === UserStatus.ACTIVE)).toBe(true)
    })

    it('should create user with password', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const user = await User.createUser(userData, 'password123')

      expect(user.name).toBe('New User')
      expect(user.hashedPassword).toBeDefined()

      const isValidPassword = await user.comparePassword('password123')
      expect(isValidPassword).toBe(true)
    })

    it('should validate password requirements', () => {
      const validPassword = User.validatePassword('Password123')
      const invalidPassword = User.validatePassword('weak')

      expect(validPassword.isValid).toBe(true)
      expect(validPassword.errors).toHaveLength(0)

      expect(invalidPassword.isValid).toBe(false)
      expect(invalidPassword.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Utility Functions', () => {
    it('should validate user data with Zod', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }

      const invalidData = {
        name: 'J',
        email: 'invalid-email',
        role: 'INVALID_ROLE'
      }

      const validResult = userUtils.validateUserData(validData)
      const invalidResult = userUtils.validateUserData(invalidData)

      expect(validResult.success).toBe(true)
      expect(invalidResult.success).toBe(false)
    })

    it('should check user management permissions', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        region: 'Mumbai'
      })

      const coordinator = await User.create({
        name: 'Coordinator',
        email: 'coordinator@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi'
      })

      const subCoordinator = await User.create({
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi',
        parentCoordinatorId: coordinator._id
      })

      const donor = await User.create({
        name: 'Donor',
        email: 'donor@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      // Admin can manage everyone
      expect(userUtils.canManageUser(admin, coordinator)).toBe(true)
      expect(userUtils.canManageUser(admin, subCoordinator)).toBe(true)
      expect(userUtils.canManageUser(admin, donor)).toBe(true)

      // Coordinator can manage their sub-coordinators
      expect(userUtils.canManageUser(coordinator, subCoordinator)).toBe(true)
      expect(userUtils.canManageUser(coordinator, donor)).toBe(false)

      // Donor cannot manage anyone
      expect(userUtils.canManageUser(donor, coordinator)).toBe(false)
    })
  })
})