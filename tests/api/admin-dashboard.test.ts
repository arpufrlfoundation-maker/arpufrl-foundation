import { NextRequest } from 'next/server'
import { GET as getDashboardStats } from '../../app/api/admin/dashboard/stats/route'
import { GET as getRecentDonations } from '../../app/api/admin/dashboard/recent-donations/route'
import { GET as getRecentUsers } from '../../app/api/admin/dashboard/recent-users/route'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation } from '../../models/Donation'
import { Program } from '../../models/Program'
import { auth } from '../../lib/auth'

// Mock auth
jest.mock('../../lib/auth', () => ({
  auth: jest.fn()
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/admin/dashboard', () => {
  let adminUser: any
  let coordinatorUser: any
  let testProgram: any

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })

    coordinatorUser = await User.create({
      name: 'Coordinator User',
      email: 'coordinator@test.com',
      role: UserRole.COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Test Region'
    })

    // Create test program
    testProgram = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'Test program description',
      active: true,
      raisedAmount: 0,
      donationCount: 0
    })

    // Create test donations
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    await Donation.create([
      {
        donorName: 'Donor 1',
        donorEmail: 'donor1@test.com',
        amount: 50000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        programId: testProgram._id,
        createdAt: thisMonth
      },
      {
        donorName: 'Donor 2',
        donorEmail: 'donor2@test.com',
        amount: 30000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_2',
        razorpayPaymentId: 'pay_2',
        createdAt: lastMonth
      },
      {
        donorName: 'Donor 3',
        donorEmail: 'donor3@test.com',
        amount: 25000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_3',
        razorpayPaymentId: 'pay_3',
        createdAt: lastWeek
      }
    ])
  })

  describe('GET /api/admin/dashboard/stats', () => {
    it('should return dashboard statistics for admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')
      const response = await getDashboardStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalDonations).toBeDefined()
      expect(data.totalDonations.amount).toBe(105000) // 50000 + 30000 + 25000
      expect(data.totalDonations.count).toBe(3)
      expect(data.totalDonations.growth).toBeDefined()

      expect(data.totalUsers).toBeDefined()
      expect(data.totalUsers.count).toBe(2) // admin + coordinator
      expect(data.totalUsers.active).toBe(2)

      expect(data.totalPrograms).toBeDefined()
      expect(data.totalPrograms.count).toBe(1)
      expect(data.totalPrograms.active).toBe(1)

      expect(data.coordinators).toBeDefined()
      expect(data.coordinators.count).toBe(1) // Only coordinator user

      expect(data.recentActivity).toBeDefined()
      expect(data.recentActivity.donations).toBe(1) // Only last week donation
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')
      const response = await getDashboardStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })

    it('should deny access to unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')
      const response = await getDashboardStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })

    it('should calculate monthly growth correctly', async () => {
      // Create additional donations for last month to test growth calculation
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)
      await Donation.create({
        donorName: 'Last Month Donor',
        amount: 40000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_last_month',
        razorpayPaymentId: 'pay_last_month',
        createdAt: lastMonth
      })

      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')
      const response = await getDashboardStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalDonations.growth).toBeDefined()
      expect(typeof data.totalDonations.growth).toBe('number')
    })
  })

  describe('GET /api/admin/dashboard/recent-donations', () => {
    it('should return recent donations for admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-donations?limit=5')
      const response = await getRecentDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations).toBeDefined()
      expect(Array.isArray(data.donations)).toBe(true)
      expect(data.donations.length).toBeLessThanOrEqual(5)
      expect(data.total).toBeDefined()

      // Check donation structure
      if (data.donations.length > 0) {
        const donation = data.donations[0]
        expect(donation.id).toBeDefined()
        expect(donation.donorName).toBeDefined()
        expect(donation.amount).toBeDefined()
        expect(donation.createdAt).toBeDefined()
      }
    })

    it('should respect limit parameter', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-donations?limit=2')
      const response = await getRecentDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBeLessThanOrEqual(2)
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-donations')
      const response = await getRecentDonations(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('GET /api/admin/dashboard/recent-users', () => {
    it('should return recent users for admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-users?limit=5')
      const response = await getRecentUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users.length).toBeLessThanOrEqual(5)
      expect(data.total).toBeDefined()

      // Check user structure
      if (data.users.length > 0) {
        const user = data.users[0]
        expect(user.id).toBeDefined()
        expect(user.name).toBeDefined()
        expect(user.email).toBeDefined()
        expect(user.role).toBeDefined()
        expect(user.status).toBeDefined()
        expect(user.createdAt).toBeDefined()
      }
    })

    it('should respect limit parameter', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-users?limit=1')
      const response = await getRecentUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBeLessThanOrEqual(1)
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-users')
      const response = await getRecentUsers(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })

    it('should return users in descending order by creation date', async () => {
      // Create additional user
      const newerUser = await User.create({
        name: 'Newer User',
        email: 'newer@test.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/recent-users')
      const response = await getRecentUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBeGreaterThan(0)

      // Check that users are ordered by creation date (newest first)
      if (data.users.length > 1) {
        const firstUser = new Date(data.users[0].createdAt)
        const secondUser = new Date(data.users[1].createdAt)
        expect(firstUser.getTime()).toBeGreaterThanOrEqual(secondUser.getTime())
      }
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)

      // Mock database error by closing connection
      const mongoose = require('mongoose')
      await mongoose.connection.close()

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')
      const response = await getDashboardStats(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch dashboard statistics')

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_URI_TEST)
    })
  })
})