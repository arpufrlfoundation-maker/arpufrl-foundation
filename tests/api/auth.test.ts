import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { User, UserRole, UserStatus } from '../../models/User'

// Mock NextRequest and NextResponse
const mockRequest = (body: any, searchParams?: Record<string, string>) => ({
  json: async () => body,
  url: searchParams ? `http://localhost?${new URLSearchParams(searchParams).toString()}` : 'http://localhost'
})

const mockResponse = {
  json: (data: any, init?: ResponseInit) => ({
    json: async () => data,
    status: init?.status || 200,
    ok: (init?.status || 200) < 400
  })
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => mockResponse.json(data, init)
  }
}))

describe('Authentication API Routes', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
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

  describe('POST /api/auth (User Registration)', () => {
    it('should register a new donor user successfully', async () => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        role: UserRole.DONOR
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.message).toBe('User registered successfully')
      expect(result.user.email).toBe(userData.email)
      expect(result.user.name).toBe(userData.name)
      expect(result.user.role).toBe(UserRole.DONOR)
      expect(result.user.status).toBe(UserStatus.ACTIVE)
      expect(result.user.hashedPassword).toBeUndefined()
    })

    it('should register a coordinator with pending status', async () => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'Jane Coordinator',
        email: 'jane@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        role: UserRole.COORDINATOR,
        region: 'North'
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.user.role).toBe(UserRole.COORDINATOR)
      expect(result.user.status).toBe(UserStatus.PENDING)
      expect(result.user.region).toBe('North')
    })

    it('should reject registration with invalid email', async () => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123'
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
      expect(result.details).toBeDefined()
    })

    it('should reject registration with weak password', async => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
    })

    it('should reject registration with mismatched passwords', async () => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        confirmPassword: 'DifferentPass123'
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
    })

    it('should reject duplicate email registration', async () => {
      // Create existing user
      await User.createUser({
        name: 'Existing User',
        email: 'existing@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }, 'ExistingPass123')

      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'NewPass123',
        confirmPassword: 'NewPass123'
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('User with this email already exists')
    })

    it('should validate parent coordinator for sub-coordinators', async () => {
      // Create a coordinator first
      const coordinator = await User.createUser({
        name: 'Parent Coordinator',
        email: 'parent@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'North'
      })

      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        role: UserRole.SUB_COORDINATOR,
        region: 'North',
        parentCoordinatorId: coordinator._id.toString()
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.user.parentCoordinatorId).toBe(coordinator._id.toString())
    })

    it('should reject invalid parent coordinator', async () => {
      const { POST } = await import('../../app/api/auth/route')

      const userData = {
        name: 'Sub Coordinator',
        email: 'sub@example.com',
        password: 'StrongPass123',
        confirmPassword: 'StrongPass123',
        role: UserRole.SUB_COORDINATOR,
        region: 'North',
        parentCoordinatorId: new mongoose.Types.ObjectId().toString()
      }

      const request = mockRequest(userData)
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid parent coordinator')
    })
  })

  describe('GET /api/auth (Get User Profile)', () => {
    it('should return user profile for valid user ID', async () => {
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      const { GET } = await import('../../app/api/auth/route')

      const request = mockRequest({}, { userId: user._id.toString() })
      const response = await GET(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.user.email).toBe(user.email)
      expect(result.user.name).toBe(user.name)
      expect(result.user.hashedPassword).toBeUndefined()
    })

    it('should return 400 for missing user ID', async () => {
      const { GET } = await import('../../app/api/auth/route')

      const request = mockRequest({})
      const response = await GET(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('User ID is required')
    })

    it('should return 404 for non-existent user', async () => {
      const { GET } = await import('../../app/api/auth/route')

      const request = mockRequest({}, { userId: new mongoose.Types.ObjectId().toString() })
      const response = await GET(request as any)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('User not found')
    })
  })

  describe('Password Reset API', () => {
    it('should handle password reset request', async () => {
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      }, 'OriginalPass123')

      const { POST } = await import('../../app/api/auth/reset-password/route')

      const request = mockRequest({ email: user.email })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toContain('password reset link has been sent')
    })

    it('should handle password reset request for non-existent email', async () => {
      const { POST } = await import('../../app/api/auth/reset-password/route')

      const request = mockRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toContain('password reset link has been sent')
    })

    it('should reject invalid email format', async () => {
      const { POST } = await import('../../app/api/auth/reset-password/route')

      const request = mockRequest({ email: 'invalid-email' })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
    })
  })

  describe('Email Verification API', () => {
    it('should handle email verification request', async () => {
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.PENDING
      })

      const { POST } = await import('../../app/api/auth/verify-email/route')

      const request = mockRequest({ email: user.email })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Verification email sent successfully')
    })

    it('should handle already verified email', async () => {
      const user = await User.createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      // Mark as verified
      await User.findByIdAndUpdate(user._id, { emailVerified: new Date() })

      const { POST } = await import('../../app/api/auth/verify-email/route')

      const request = mockRequest({ email: user.email })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Email is already verified')
    })

    it('should return 404 for non-existent user', async () => {
      const { POST } = await import('../../app/api/auth/verify-email/route')

      const request = mockRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('User not found')
    })
  })
})