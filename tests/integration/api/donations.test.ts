/**
 * Integration Tests: Donations API
 * Tests the complete donation flow including Razorpay integration
 */

import { createMocks } from 'node-mocks-http'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { POST as createOrder } from '@/app/api/donations/create-order/route'
import { POST as verifyPayment } from '@/app/api/donations/verify-payment/route'
import { Program } from '@/models/Program'
import { Donation } from '@/models/Donation'
import { User } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

describe('Donations API', () => {
  let testProgram: any
  let testUser: any
  let testReferralCode: any

  beforeEach(async () => {
    // Create test program
    testProgram = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'Test program for donations',
      targetAmount: 100000,
      raisedAmount: 0,
      active: true
    })

    // Create test user
    testUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@test.com',
      phone: '+919876543210',
      password: 'hashed_password',
      role: 'DISTRICT_COORDINATOR',
      status: 'ACTIVE'
    })

    // Create referral code
    testReferralCode = await ReferralCode.create({
      code: 'TEST123',
      ownerUserId: testUser._id,
      isActive: true,
      totalAmount: 0,
      totalDonations: 0
    })
  })

  afterEach(async () => {
    await Program.deleteMany({})
    await User.deleteMany({})
    await ReferralCode.deleteMany({})
    await Donation.deleteMany({})
  })

  describe('POST /api/donations/create-order', () => {
    it('should create Razorpay order successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          amount: 500,
          donorName: 'John Doe',
          donorEmail: 'john@test.com',
          programId: testProgram._id.toString(),
          referralCode: 'TEST123'
        }
      })

      const response = await createOrder(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.orderId).toBeDefined()
      expect(data.amount).toBe(50000) // in paise
      expect(data.currency).toBe('INR')
      expect(data.notes).toMatchObject({
        donorName: 'John Doe',
        programId: testProgram._id.toString(),
        referralCode: 'TEST123'
      })
    })

    it('should reject invalid amount', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          amount: 50, // Below minimum
          donorName: 'John Doe',
          donorEmail: 'john@test.com'
        }
      })

      const response = await createOrder(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('amount')
    })

    it('should handle missing programId gracefully', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          amount: 500,
          donorName: 'John Doe',
          donorEmail: 'john@test.com'
          // No programId
        }
      })

      const response = await createOrder(req as any)
      const data = await response.json()

      // Should still create order (programId optional)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should validate referral code exists', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          amount: 500,
          donorName: 'John Doe',
          referralCode: 'INVALID'
        }
      })

      const response = await createOrder(req as any)
      const data = await response.json()

      // Should warn but not fail
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/donations/verify-payment', () => {
    it('should verify payment and create donation record', async () => {
      // Mock Razorpay verification
      jest.mock('@/lib/razorpay', () => ({
        RazorpayService: {
          verifyPaymentSignature: jest.fn(() => true),
          fetchOrder: jest.fn(() => ({
            id: 'order_123',
            amount: 50000,
            currency: 'INR',
            notes: {
              donorName: 'John Doe',
              donorEmail: 'john@test.com',
              programId: testProgram._id.toString(),
              referralCode: 'TEST123'
            }
          })),
          fetchPayment: jest.fn(() => ({
            id: 'pay_123',
            method: 'upi'
          }))
        }
      }))

      const { req } = createMocks({
        method: 'POST',
        body: {
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'valid_signature'
        }
      })

      const response = await verifyPayment(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.donationId).toBeDefined()

      // Verify donation created
      const donation = await Donation.findById(data.donationId)
      expect(donation).toBeDefined()
      expect(donation?.amount).toBe(500)
      expect(donation?.paymentStatus).toBe('SUCCESS')

      // Verify program updated
      const updatedProgram = await Program.findById(testProgram._id)
      expect(updatedProgram?.raisedAmount).toBe(500)
      expect(updatedProgram?.donationCount).toBe(1)

      // Verify referral code updated
      const updatedReferral = await ReferralCode.findById(testReferralCode._id)
      expect(updatedReferral?.totalAmount).toBe(500)
      expect(updatedReferral?.totalDonations).toBe(1)
    })

    it('should reject invalid payment signature', async () => {
      jest.mock('@/lib/razorpay', () => ({
        RazorpayService: {
          verifyPaymentSignature: jest.fn(() => false)
        }
      }))

      const { req } = createMocks({
        method: 'POST',
        body: {
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'invalid_signature'
        }
      })

      const response = await verifyPayment(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('signature')

      // Verify no donation created
      const donationCount = await Donation.countDocuments()
      expect(donationCount).toBe(0)
    })
  })

  describe('Commission Distribution', () => {
    it('should distribute commission correctly after donation', async () => {
      // Create hierarchy
      const national = await User.create({
        name: 'National Coordinator',
        email: 'national@test.com',
        phone: '+919876543211',
        password: 'hashed',
        role: 'NATIONAL_PRESIDENT',
        status: 'ACTIVE'
      })

      const state = await User.create({
        name: 'State Coordinator',
        email: 'state@test.com',
        phone: '+919876543212',
        password: 'hashed',
        role: 'STATE_COORDINATOR',
        status: 'ACTIVE',
        parentCoordinatorId: national._id
      })

      const volunteer = await User.create({
        name: 'Volunteer',
        email: 'volunteer@test.com',
        phone: '+919876543213',
        password: 'hashed',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        parentCoordinatorId: state._id
      })

      // Create referral code for volunteer
      const refCode = await ReferralCode.create({
        code: 'VOL123',
        ownerUserId: volunteer._id,
        isActive: true
      })

      // Simulate donation of ₹10,000
      const donation = await Donation.create({
        donorName: 'Test Donor',
        amount: 10000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_test',
        razorpayPaymentId: 'pay_test',
        referralCodeId: refCode._id,
        referredBy: volunteer._id
      })

      // Import and run commission distribution
      const { processCommissionDistribution } = await import('@/lib/commission-utils')
      await processCommissionDistribution(donation._id)

      // Check CommissionLog entries
      const CommissionLog = mongoose.model('CommissionLog')
      const logs = await CommissionLog.find({ donationId: donation._id })

      expect(logs).toHaveLength(3)

      // Volunteer: 0%
      const volunteerLog = logs.find((l: any) => l.userId.equals(volunteer._id))
      expect(volunteerLog).toBeDefined()
      expect(volunteerLog?.amount).toBe(0)

      // State (volunteer's parent): 5%
      const stateLog = logs.find((l: any) => l.userId.equals(state._id))
      expect(stateLog).toBeDefined()
      expect(stateLog?.amount).toBe(500)

      // National: 15%
      const nationalLog = logs.find((l: any) => l.userId.equals(national._id))
      expect(nationalLog).toBeDefined()
      expect(nationalLog?.amount).toBe(1500)
    })
  })
})
