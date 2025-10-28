import { NextRequest } from 'next/server'
import { GET } from '../../app/api/referrals/analytics/route'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation, PaymentStatus } from '../../models/Donation'
import { ReferralCode, ReferralCodeType } from '../../models/ReferralCode'
import { Program } from '../../models/Program'
import { getServerSession } from 'next-auth'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/referrals/analytics', () => {
  let adminUser: any
  let coordinatorUser: any
  let subCoordinatorUser: any
  let coordinatorCode: any
  let subCoordinatorCode: any
  let program: any

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

    // Create test program
    program = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'Test program description',
      targetAmount: 100000,
      raisedAmount: 0,
      donationCount: 0,
      active: true
    })

    // Create referral codes
    coordinatorCode = await ReferralCode.create({
      code: 'COORD-MUM-01',
      ownerUserId: coordinatorUser._id,
      type: ReferralCodeType.COORDINATOR,
      region: 'Mumbai',
      active: true,
      totalAmount: 0,
      totalDonations: 0
    })

    subCoordinatorCode = await ReferralCode.create({
      code: 'SUB-MUM-01',
      ownerUserId: subCoordinatorUser._id,
      parentCodeId: coordinatorCode._id,
      type: ReferralCodeType.SUB_COORDINATOR,
      region: 'Mumbai',
      active: true,
      totalAmount: 0,
      totalDonations: 0
    })

    // Create test donations
    const donations = [
      {
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 5000,
        currency: 'INR',
        programId: program._id,
        paymentStatus: PaymentStatus.SUCCESS,
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        referralCodeId: coordinatorCode._id,
        attributedToUserId: coordinatorUser._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        donorName: 'Jane Smith',
        donorEmail: 'jane@example.com',
        amount: 3000,
        currency: 'INR',
        programId: program._id,
        paymentStatus: PaymentStatus.SUCCESS,
        razorpayOrderId: 'order_2',
        razorpayPaymentId: 'pay_2',
        referralCodeId: subCoordinatorCode._id,
        attributedToUserId: subCoordinatorUser._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        donorName: 'Bob Wilson',
        donorEmail: 'bob@example.com',
        amount: 7000,
        currency: 'INR',
        programId: program._id,
        paymentStatus: PaymentStatus.SUCCESS,
        razorpayOrderId: 'order_3',
        razorpayPaymentId: 'pay_3',
        referralCodeId: coordinatorCode._id,
        attributedToUserId: coordinatorUser._id,
        createdAt: new Date() // Today
      }
    ]

    await Donation.insertMany(donations)

    // Update referral code statistics
    await ReferralCode.findByIdAndUpdate(coordinatorCode._id, {
      totalAmount: 12000,
      totalDonations: 2
    })

    await ReferralCode.findByIdAndUpdate(subCoordinatorCode._id, {
      totalAmount: 3000,
      totalDonations: 1
    })
  })

  describe('GET /api/referrals/analytics', () => {
    it('should return analytics data for coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview).toBeDefined()
      expect(data.overview.totalAmount).toBe(15000) // All donations in hierarchy
      expect(data.overview.totalDonations).toBe(3)
      expect(data.overview.averageDonation).toBe(5000)
      expect(data.overview.activeSubCoordinators).toBe(1)

      expect(data.trends).toBeDefined()
      expect(Array.isArray(data.trends)).toBe(true)

      expect(data.topPerformers).toBeDefined()
      expect(Array.isArray(data.topPerformers)).toBe(true)

      expect(data.recentDonations).toBeDefined()
      expect(Array.isArray(data.recentDonations)).toBe(true)
      expect(data.recentDonations.length).toBe(3)

      expect(data.codeUsage).toBeDefined()
      expect(Array.isArray(data.codeUsage)).toBe(true)
    })

    it('should return analytics data for sub-coordinator', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: subCoordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${subCoordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview.totalAmount).toBe(3000) // Only sub-coordinator's donations
      expect(data.overview.totalDonations).toBe(1)
      expect(data.overview.activeSubCoordinators).toBe(0) // Sub-coordinators don't have sub-coordinators
    })

    it('should allow admin to access any coordinator analytics', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should filter data by time range', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      // Test 7-day range (should only include recent donations)
      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=7d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview.totalDonations).toBe(3) // All donations are within 7 days
    })

    it('should include top performers data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.topPerformers).toBeDefined()
      expect(data.topPerformers.length).toBeGreaterThan(0)

      const topPerformer = data.topPerformers[0]
      expect(topPerformer.name).toBe('Test Sub Coordinator')
      expect(topPerformer.totalAmount).toBe(3000)
      expect(topPerformer.totalDonations).toBe(1)
    })

    it('should include recent donations with proper formatting', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.recentDonations).toBeDefined()
      expect(data.recentDonations.length).toBe(3)

      const donation = data.recentDonations[0]
      expect(donation.donorName).toBeDefined()
      expect(donation.amount).toBeDefined()
      expect(donation.createdAt).toBeDefined()
      expect(donation.referralCode).toBeDefined()
      expect(donation.attributedTo).toBeDefined()
    })

    it('should include referral code usage statistics', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.codeUsage).toBeDefined()
      expect(data.codeUsage.length).toBeGreaterThan(0)

      const codeUsage = data.codeUsage.find((usage: any) => usage.code === 'COORD-MUM-01')
      expect(codeUsage).toBeDefined()
      expect(codeUsage.usageCount).toBe(2)
      expect(codeUsage.totalAmount).toBe(12000)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid user ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = 'http://localhost:3000/api/referrals/analytics?userId=invalid&timeRange=30d'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const fakeUserId = '507f1f77bcf86cd799439011'
      const url = `http://localhost:3000/api/referrals/analytics?userId=${fakeUserId}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(404)
    })

    it('should return 403 for insufficient permissions', async () => {
      const anotherCoordinator = await User.create({
        name: 'Another Coordinator',
        email: 'another@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi'
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: anotherCoordinator._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should allow coordinator to access sub-coordinator analytics', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${subCoordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle empty analytics data gracefully', async () => {
      // Create a new coordinator with no donations
      const newCoordinator = await User.create({
        name: 'New Coordinator',
        email: 'new@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi'
      })

      await ReferralCode.create({
        code: 'NEW-DEL-01',
        ownerUserId: newCoordinator._id,
        type: ReferralCodeType.COORDINATOR,
        region: 'Delhi',
        active: true,
        totalAmount: 0,
        totalDonations: 0
      })

      mockGetServerSession.mockResolvedValue({
        user: { id: newCoordinator._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${newCoordinator._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview.totalAmount).toBe(0)
      expect(data.overview.totalDonations).toBe(0)
      expect(data.overview.averageDonation).toBe(0)
      expect(data.trends).toEqual([])
      expect(data.topPerformers).toEqual([])
      expect(data.recentDonations).toEqual([])
    })

    it('should default to 30d time range when not specified', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}`
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Should behave same as 30d range
    })

    it('should calculate conversion rate correctly', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: coordinatorUser._id.toString() }
      })

      const url = `http://localhost:3000/api/referrals/analytics?userId=${coordinatorUser._id}&timeRange=30d`
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview.conversionRate).toBeGreaterThanOrEqual(0)
      expect(data.overview.conversionRate).toBeLessThanOrEqual(100)
    })
  })
})