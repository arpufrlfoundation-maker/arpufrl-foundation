import { NextRequest } from 'next/server'
import { GET, POST } from '../../app/api/coordinators/route'
import { ReferralCode, ReferralCodeType } from '../../models/ReferralCode'
import { User, UserRole, UserStatus } from '../../models/User'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>

describe('/api/coordinators', () => {
  let adminUser: any
  let coordinatorUser: any
  let subCoordinatorUser: any
  let coordinatorCode: any

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })

    coordinatorUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@example.com',
      role: UserRole.COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Mumbai'
    })

    subCoordinatorUser = await User.create({
      name: 'Test Sub Coordinator',
      email: 'sub@example.com',
      role: UserRole.SUB_COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Mumbai',
      parentCoordinatorId: coordinatorUser._id
    })

    // Create referral code for coordinator
    coordinatorCode = await ReferralCode.create({
      code: 'COORD-MUM-01',
      ownerUserId: coordinatorUser._id,
      type: ReferralCodeType.COORDINATOR,
      region: 'Mumbai',
      active: true,
      totalAmount: 5000,
      totalDonations: 2
    })

    // Create referral code for sub-coordinator
    await ReferralCode.create({
      code: 'SUB-MUM-01',
      ownerUserId: subCoordinatorUser._id,
      parentCodeId: coordinatorCode._id,
      type: ReferralCodeType.SUB_COORDINATOR,
      region: 'Mumbai',
      active: true,
      totalAmount: 3000,
      totalDonations: 1
    })
  })

  describe('GET /api/coordinators', () => {
    it('should return all coordinators for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinators).toBeDefined()
      expect(data.coordinators.length).toBe(2) // Coordinator + sub-coordinator
      expect(data.pagination).toBeDefined()

      // Check that referral codes are included
      const coordWithCode = data.coordinators.find((c: any) => c.role === 'COORDINATOR')
      expect(coordWithCode.referralCode).toBeDefined()
      expect(coordWithCode.referralCode.code).toBe('COORD-MUM-01')
    })

    it('should return coordinator and sub-coordinators for coordinator user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinators.length).toBe(2) // Self + sub-coordinator
    })

    it('should filter by role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators?role=COORDINATOR')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinators.every((c: any) => c.role === 'COORDINATOR')).toBe(true)
    })

    it('should filter by status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators?status=ACTIVE')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinators.every((c: any) => c.status === 'ACTIVE')).toBe(true)
    })

    it('should filter by region', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators?region=Mumbai')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinators.every((c: any) => c.region === 'Mumbai')).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/coordinators')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-coordinator/admin user', async () => {
      const donorUser = await User.create({
        name: 'Donor User',
        email: 'donor@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: donorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/coordinators', () => {
    const validCoordinatorData = {
      name: 'New Coordinator',
      email: 'newcoord@example.com',
      phone: '+919876543210',
      region: 'Delhi',
      role: UserRole.COORDINATOR,
      password: 'SecurePass123'
    }

    const validSubCoordinatorData = {
      name: 'New Sub Coordinator',
      email: 'newsub@example.com',
      phone: '+919876543211',
      region: 'Mumbai',
      role: UserRole.SUB_COORDINATOR,
      parentCoordinatorId: '',
      password: 'SecurePass123'
    }

    beforeEach(() => {
      validSubCoordinatorData.parentCoordinatorId = coordinatorUser._id.toString()
    })

    it('should create coordinator for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(validCoordinatorData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Coordinator')
      expect(data.email).toBe('newcoord@example.com')
      expect(data.role).toBe(UserRole.COORDINATOR)
      expect(data.referralCode).toBeDefined()
      expect(mockBcryptHash).toHaveBeenCalledWith('SecurePass123', 12)
    })

    it('should create sub-coordinator for coordinator user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(validSubCoordinatorData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Sub Coordinator')
      expect(data.role).toBe(UserRole.SUB_COORDINATOR)
      expect(data.parentCoordinatorId.toString()).toBe(coordinatorUser._id.toString())
      expect(data.referralCode).toBeDefined()
    })

    it('should return 400 for invalid input', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email',
        role: 'INVALID_ROLE'
      }

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 409 for duplicate email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const duplicateEmailData = {
        ...validCoordinatorData,
        email: coordinatorUser.email // Use existing email
      }

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(duplicateEmailData)
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should return 400 for invalid parent coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const invalidParentData = {
        ...validSubCoordinatorData,
        parentCoordinatorId: adminUser._id.toString() // Admin as parent, but not coordinator
      }

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(invalidParentData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 403 for insufficient permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: subCoordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(validCoordinatorData)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 when coordinator tries to create coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(validCoordinatorData)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 when sub-coordinator parent mismatch', async () => {
      const anotherCoordinator = await User.create({
        name: 'Another Coordinator',
        email: 'another@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi'
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const mismatchData = {
        ...validSubCoordinatorData,
        parentCoordinatorId: anotherCoordinator._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(mismatchData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle referral code creation failure gracefully', async () => {
      // Create a user that already has a referral code to force failure
      const existingUser = await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Pune'
      })

      await ReferralCode.create({
        code: 'EXISTING-CODE',
        ownerUserId: existingUser._id,
        type: ReferralCodeType.COORDINATOR,
        active: true
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const requestData = {
        ...validCoordinatorData,
        email: 'another@example.com'
      }

      // Mock ReferralCode.createForUser to throw an error
      const originalCreateForUser = ReferralCode.createForUser
      ReferralCode.createForUser = jest.fn().mockRejectedValue(new Error('Code generation failed'))

      const request = new NextRequest('http://localhost:3000/api/coordinators', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201) // Should still create user
      expect(data.referralCode).toBeNull()
      expect(data.warning).toContain('referral code generation failed')

      // Restore original method
      ReferralCode.createForUser = originalCreateForUser
    })
  })
})