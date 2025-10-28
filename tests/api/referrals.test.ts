import { NextRequest } from 'next/server'
import { GET, POST } from '../../app/api/referrals/route'
import { GET as validateGET, POST as validatePOST } from '../../app/api/referrals/validate/route'
import { ReferralCode, ReferralCodeType } from '../../models/ReferralCode'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation, PaymentStatus } from '../../models/Donation'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/referrals', () => {
  let adminUser: any
  let coordinatorUser: any
  let subCoordinatorUser: any
  let coordinatorCode: any
  let subCoordinatorCode: any

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

    // Create referral codes
    coordinatorCode = await ReferralCode.create({
      code: 'COORD-MUM-01',
      ownerUserId: coordinatorUser._id,
      type: ReferralCodeType.COORDINATOR,
      region: 'Mumbai',
      active: true,
      totalAmount: 5000,
      totalDonations: 2
    })

    subCoordinatorCode = await ReferralCode.create({
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

  describe('GET /api/referrals', () => {
    it('should return referral codes for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.referralCodes).toBeDefined()
      expect(data.referralCodes.length).toBeGreaterThanOrEqual(2)
      expect(data.pagination).toBeDefined()
    })

    it('should return only coordinator and sub-coordinator codes for coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.referralCodes).toBeDefined()
      expect(data.referralCodes.length).toBe(2) // Coordinator + sub-coordinator
    })

    it('should return only own codes for sub-coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: subCoordinatorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.referralCodes).toBeDefined()
      expect(data.referralCodes.length).toBe(1) // Only sub-coordinator's code
      expect(data.referralCodes[0].code).toBe('SUB-MUM-01')
    })

    it('should filter by type', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals?type=COORDINATOR')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.referralCodes.every((code: any) => code.type === 'COORDINATOR')).toBe(true)
    })

    it('should filter by region', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals?region=Mumbai')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.referralCodes.every((code: any) => code.region === 'Mumbai')).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/referrals')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for donor user', async () => {
      const donorUser = await User.create({
        name: 'Donor User',
        email: 'donor@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: donorUser._id.toString() }
      })

      const request = new NextRequest('http://localhost:3000/api/referrals')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/referrals', () => {
    it('should create referral code for admin', async () => {
      const newUser = await User.create({
        name: 'New Coordinator',
        email: 'new@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi'
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const requestBody = {
        ownerUserId: newUser._id.toString(),
        region: 'Delhi'
      }

      const request = new NextRequest('http://localhost:3000/api/referrals', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.ownerUserId.toString()).toBe(newUser._id.toString())
      expect(data.region).toBe('Delhi')
      expect(data.active).toBe(true)
    })

    it('should allow coordinator to create code for sub-coordinator', async () => {
      const newSubCoordinator = await User.create({
        name: 'New Sub Coordinator',
        email: 'newsub@example.com',
        role: UserRole.SUB_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
        parentCoordinatorId: coordinatorUser._id
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const requestBody = {
        ownerUserId: newSubCoordinator._id.toString(),
        parentCodeId: coordinatorCode._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/referrals', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.ownerUserId.toString()).toBe(newSubCoordinator._id.toString())
      expect(data.parentCodeId.toString()).toBe(coordinatorCode._id.toString())
    })

    it('should return 400 for invalid input', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const requestBody = {
        ownerUserId: 'invalid-id'
      }

      const request = new NextRequest('http://localhost:3000/api/referrals', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 409 for user with existing active code', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const requestBody = {
        ownerUserId: coordinatorUser._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/referrals', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should return 403 for insufficient permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: subCoordinatorUser._id.toString() }
      })

      const requestBody = {
        ownerUserId: coordinatorUser._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/referrals', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/referrals/validate', () => {
    it('should validate active referral code', async () => {
      const requestBody = {
        code: 'COORD-MUM-01'
      }

      const request = new NextRequest('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await validatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.referralCode.code).toBe('COORD-MUM-01')
      expect(data.referralCode.owner.name).toBe('Test Coordinator')
    })

    it('should return invalid for non-existent code', async () => {
      const requestBody = {
        code: 'NONEXISTENT'
      }

      const request = new NextRequest('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await validatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(false)
      expect(data.message).toContain('not found')
    })

    it('should return invalid for inactive code', async () => {
      // Deactivate the code
      await coordinatorCode.deactivate()

      const requestBody = {
        code: 'COORD-MUM-01'
      }

      const request = new NextRequest('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await validatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(false)
    })

    it('should return 400 for invalid input', async () => {
      const requestBody = {
        code: 'AB' // Too short
      }

      const request = new NextRequest('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await validatePOST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/referrals/validate', () => {
    it('should validate referral code via query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/referrals/validate?code=COORD-MUM-01')
      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.referralCode.code).toBe('COORD-MUM-01')
    })

    it('should return 400 when code parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/referrals/validate')
      const response = await validateGET(request)

      expect(response.status).toBe(400)
    })

    it('should handle case-insensitive code validation', async () => {
      const request = new NextRequest('http://localhost:3000/api/referrals/validate?code=coord-mum-01')
      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.referralCode.code).toBe('COORD-MUM-01')
    })
  })
})