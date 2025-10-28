import { NextRequest } from 'next/server'
import { GET as getDonations } from '../../app/api/admin/donations/route'
import { GET as getDonationStats } from '../../app/api/admin/donations/stats/route'
import { GET as exportDonations } from '../../app/api/admin/donations/export/route'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation } from '../../models/Donation'
import { Program } from '../../models/Program'
import { ReferralCode } from '../../models/ReferralCode'
import { auth } from '../../lib/auth'

// Mock auth
jest.mock('../../lib/auth', () => ({
  auth: jest.fn()
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/admin/donations', () => {
  let adminUser: any
  let coordinatorUser: any
  let testProgram: any
  let testReferralCode: any

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

    // Create test referral code
    testReferralCode = await ReferralCode.create({
      code: 'TEST-REF-01',
      ownerUserId: coordinatorUser._id,
      type: 'COORDINATOR',
      active: true
    })

    // Create test donations
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    await Donation.create([
      {
        donorName: 'John Doe',
        donorEmail: 'john@test.com',
        donorPhone: '+919876543210',
        amount: 50000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        programId: testProgram._id,
        referralCodeId: testReferralCode._id,
        createdAt: thisMonth
      },
      {
        donorName: 'Jane Smith',
        donorEmail: 'jane@test.com',
        amount: 30000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_2',
        razorpayPaymentId: 'pay_2',
        createdAt: lastMonth
      },
      {
        donorName: 'Bob Wilson',
        donorEmail: 'bob@test.com',
        amount: 25000,
        currency: 'INR',
        paymentStatus: 'PENDING',
        razorpayOrderId: 'order_3',
        createdAt: thisMonth
      },
      {
        donorName: 'Alice Brown',
        donorEmail: 'alice@test.com',
        amount: 75000,
        currency: 'INR',
        paymentStatus: 'FAILED',
        razorpayOrderId: 'order_4',
        createdAt: thisMonth
      }
    ])
  })

  describe('GET /api/admin/donations', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should return paginated donations for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?page=1&limit=2')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations).toBeDefined()
      expect(Array.isArray(data.donations)).toBe(true)
      expect(data.donations.length).toBeLessThanOrEqual(2)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.currentPage).toBe(1)
      expect(data.pagination.totalCount).toBe(4)
      expect(data.pagination.totalPages).toBe(2)

      // Check donation structure
      const donation = data.donations[0]
      expect(donation.id).toBeDefined()
      expect(donation.donorName).toBeDefined()
      expect(donation.amount).toBeDefined()
      expect(donation.paymentStatus).toBeDefined()
      expect(donation.createdAt).toBeDefined()
    })

    it('should filter donations by search term', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?search=John')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBe(1)
      expect(data.donations[0].donorName).toBe('John Doe')
    })

    it('should filter donations by payment status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?status=SUCCESS')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBe(2)
      data.donations.forEach((donation: any) => {
        expect(donation.paymentStatus).toBe('SUCCESS')
      })
    })

    it('should filter donations by program', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/donations?program=${testProgram._id}`)
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBe(1)
      expect(data.donations[0].program.id).toBe(testProgram._id.toString())
    })

    it('should filter donations by date range', async () => {
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const dateFrom = thisMonth.toISOString().split('T')[0]

      const request = new NextRequest(`http://localhost:3000/api/admin/donations?dateFrom=${dateFrom}`)
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBe(3) // This month donations
    })

    it('should filter donations by amount range', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?minAmount=40000&maxAmount=60000')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBe(1)
      expect(data.donations[0].amount).toBe(50000)
    })

    it('should sort donations by specified field', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?sortBy=amount&sortOrder=desc')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.donations.length).toBeGreaterThan(1)

      // Check if sorted by amount in descending order
      for (let i = 0; i < data.donations.length - 1; i++) {
        expect(data.donations[i].amount).toBeGreaterThanOrEqual(data.donations[i + 1].amount)
      }
    })

    it('should include referral code information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Find donation with referral code
      const donationWithReferral = data.donations.find((d: any) => d.referralCode)
      expect(donationWithReferral).toBeDefined()
      expect(donationWithReferral.referralCode.code).toBe('TEST-REF-01')
      expect(donationWithReferral.referralCode.ownerName).toBe('Coordinator User')
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

      const request = new NextRequest('http://localhost:3000/api/admin/donations')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('GET /api/admin/donations/stats', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should return donation statistics for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations/stats')
      const response = await getDonationStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalAmount).toBe(80000) // Only SUCCESS donations: 50000 + 30000
      expect(data.totalCount).toBe(2) // Only SUCCESS donations
      expect(data.averageAmount).toBe(40000) // 80000 / 2
      expect(data.monthlyGrowth).toBeDefined()
      expect(typeof data.monthlyGrowth).toBe('number')
    })

    it('should calculate monthly growth correctly', async () => {
      // The test data has 1 success donation this month (50000) and 1 last month (30000)
      // Growth should be (50000 - 30000) / 30000 * 100 = 66.67%
      const request = new NextRequest('http://localhost:3000/api/admin/donations/stats')
      const response = await getDonationStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.monthlyGrowth).toBeCloseTo(66.67, 1)
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

      const request = new NextRequest('http://localhost:3000/api/admin/donations/stats')
      const response = await getDonationStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('GET /api/admin/donations/export', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should export donations as CSV', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations/export?format=csv')
      const response = await exportDonations(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/csv')
      expect(response.headers.get('content-disposition')).toContain('attachment')
      expect(response.headers.get('content-disposition')).toContain('.csv')

      const csvContent = await response.text()
      expect(csvContent).toContain('Date,Donor Name,Email,Phone,Amount')
      expect(csvContent).toContain('John Doe')
      expect(csvContent).toContain('50000')
    })

    it('should export donations as HTML for PDF conversion', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations/export?format=pdf')
      const response = await exportDonations(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/html')
      expect(response.headers.get('content-disposition')).toContain('attachment')
      expect(response.headers.get('content-disposition')).toContain('.html')

      const htmlContent = await response.text()
      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('Donations Report')
      expect(htmlContent).toContain('John Doe')
    })

    it('should apply filters to export', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations/export?format=csv&status=SUCCESS')
      const response = await exportDonations(request)

      expect(response.status).toBe(200)

      const csvContent = await response.text()
      const lines = csvContent.split('\n')
      // Header + 2 SUCCESS donations + empty line at end
      expect(lines.length).toBe(4)
    })

    it('should handle invalid format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations/export?format=invalid')
      const response = await exportDonations(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid format specified')
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

      const request = new NextRequest('http://localhost:3000/api/admin/donations/export?format=csv')
      const response = await exportDonations(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error by closing connection
      const mongoose = require('mongoose')
      await mongoose.connection.close()

      const request = new NextRequest('http://localhost:3000/api/admin/donations')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch donations')

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_URI_TEST)
    })

    it('should handle invalid pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?page=0&limit=-1')
      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should default to valid values
      expect(data.pagination.currentPage).toBe(1)
    })

    it('should handle invalid date filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?dateFrom=invalid-date')
      const response = await getDonations(request)

      // Should not crash, might return empty results or ignore invalid date
      expect(response.status).toBe(200)
    })

    it('should handle invalid amount filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/donations?minAmount=invalid&maxAmount=also-invalid')
      const response = await getDonations(request)

      // Should not crash, might ignore invalid amounts
      expect(response.status).toBe(200)
    })
  })
})