import { NextRequest } from 'next/server'
import { POST as createDonation, GET as getDonations } from '../../app/api/donations/route'
import { POST as verifyPayment } from '../../app/api/donations/verify/route'
import { GET as getDonation } from '../../app/api/donations/[id]/route'
import { POST as sendReceipt } from '../../app/api/donations/receipt/route'
import { Donation } from '../../models/Donation'
import { Program } from '../../models/Program'
import { ReferralCode } from '../../models/ReferralCode'
import { User } from '../../models/User'
import { RazorpayService } from '../../lib/razorpay'

// Mock RazorpayService
jest.mock('../../lib/razorpay', () => ({
  RazorpayService: {
    createOrder: jest.fn(),
    verifyPaymentSignature: jest.fn(),
    fetchPayment: jest.fn()
  }
}))

const mockRazorpayService = RazorpayService as jest.Mocked<typeof RazorpayService>

describe('/api/donations', () => {
  let testUser: any
  let testProgram: any
  let testReferralCode: any

  beforeEach(async () => {
    // Create test data
    testUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@test.com',
      role: 'COORDINATOR',
      status: 'ACTIVE',
      region: 'Test Region'
    })

    testProgram = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'Test program description',
      active: true,
      raisedAmount: 0,
      donationCount: 0
    })

    testReferralCode = await ReferralCode.create({
      code: 'TEST-REF-01',
      ownerUserId: testUser._id,
      type: 'COORDINATOR',
      active: true
    })
  })

  describe('POST /api/donations', () => {
    it('should create donation order successfully', async () => {
      const mockOrder = {
        id: 'order_test123',
        entity: 'order',
        amount: 50000,
        amount_paid: 0,
        amount_due: 50000,
        currency: 'INR',
        receipt: 'receipt_123',
        status: 'created',
        attempts: 0,
        notes: {},
        created_at: Date.now()
      }

      mockRazorpayService.createOrder.mockResolvedValue(mockOrder)

      const requestBody = {
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        donorPhone: '+919876543210',
        amount: 50000,
        programId: testProgram._id.toString(),
        referralCode: 'TEST-REF-01'
      }

      const request = new NextRequest('http://localhost:3000/api/donations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent'
        }
      })

      const response = await createDonation(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.orderId).toBe('order_test123')
      expect(data.data.amount).toBe(50000)
      expect(data.data.programName).toBe('Test Program')
      expect(data.data.referralCode).toBe('TEST-REF-01')

      // Verify donation was created in database
      const donation = await Donation.findOne({ razorpayOrderId: 'order_test123' })
      expect(donation).toBeTruthy()
      expect(donation?.donorName).toBe('John Doe')
      expect(donation?.amount).toBe(50000)
      expect(donation?.programId?.toString()).toBe(testProgram._id.toString())
      expect(donation?.referralCodeId?.toString()).toBe(testReferralCode._id.toString())
    })

    it('should validate request data', async () => {
      const invalidRequestBody = {
        donorName: 'A', // Too short
        amount: 50, // Below minimum
        programId: 'invalid-id'
      }

      const request = new NextRequest('http://localhost:3000/api/donations', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createDonation(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle invalid program ID', async () => {
      const requestBody = {
        donorName: 'John Doe',
        amount: 50000,
        programId: '507f1f77bcf86cd799439011' // Valid ObjectId but non-existent
      }

      const request = new NextRequest('http://localhost:3000/api/donations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createDonation(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or inactive program')
    })

    it('should handle invalid referral code', async () => {
      const requestBody = {
        donorName: 'John Doe',
        amount: 50000,
        referralCode: 'INVALID-CODE'
      }

      const request = new NextRequest('http://localhost:3000/api/donations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createDonation(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid referral code')
    })

    it('should handle Razorpay order creation failure', async () => {
      mockRazorpayService.createOrder.mockRejectedValue(new Error('Razorpay API error'))

      const requestBody = {
        donorName: 'John Doe',
        amount: 50000
      }

      const request = new NextRequest('http://localhost:3000/api/donations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createDonation(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create donation order')
    })
  })

  describe('GET /api/donations', () => {
    beforeEach(async () => {
      // Create test donations
      await Donation.create([
        {
          donorName: 'Donor 1',
          amount: 50000,
          currency: 'INR',
          paymentStatus: 'SUCCESS',
          razorpayOrderId: 'order_1',
          razorpayPaymentId: 'pay_1',
          programId: testProgram._id,
          referralCodeId: testReferralCode._id
        },
        {
          donorName: 'Donor 2',
          amount: 30000,
          currency: 'INR',
          paymentStatus: 'PENDING',
          razorpayOrderId: 'order_2'
        },
        {
          donorName: 'Donor 3',
          amount: 75000,
          currency: 'INR',
          paymentStatus: 'FAILED',
          razorpayOrderId: 'order_3'
        }
      ])
    })

    it('should fetch donations with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/donations?page=1&limit=2')

      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.donations).toHaveLength(2)
      expect(data.data.pagination.currentPage).toBe(1)
      expect(data.data.pagination.totalCount).toBe(3)
      expect(data.data.pagination.totalPages).toBe(2)
    })

    it('should filter donations by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/donations?status=SUCCESS')

      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.donations).toHaveLength(1)
      expect(data.data.donations[0].paymentStatus).toBe('SUCCESS')
    })

    it('should filter donations by program', async () => {
      const request = new NextRequest(`http://localhost:3000/api/donations?programId=${testProgram._id}`)

      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.donations).toHaveLength(1)
      expect(data.data.donations[0].programId._id).toBe(testProgram._id.toString())
    })

    it('should filter donations by referral code', async () => {
      const request = new NextRequest('http://localhost:3000/api/donations?referralCode=TEST-REF-01')

      const response = await getDonations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.donations).toHaveLength(1)
      expect(data.data.donations[0].referralCodeId.code).toBe('TEST-REF-01')
    })
  })

  describe('POST /api/donations/verify', () => {
    let testDonation: any

    beforeEach(async () => {
      testDonation = await Donation.create({
        donorName: 'Test Donor',
        amount: 50000,
        currency: 'INR',
        paymentStatus: 'PENDING',
        razorpayOrderId: 'order_test123',
        programId: testProgram._id,
        referralCodeId: testReferralCode._id
      })
    })

    it('should verify payment successfully', async () => {
      mockRazorpayService.verifyPaymentSignature.mockReturnValue(true)

      const requestBody = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature',
        donationId: testDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await verifyPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.paymentId).toBe('pay_test123')
      expect(data.data.status).toBe('SUCCESS')

      // Verify donation was updated in database
      const updatedDonation = await Donation.findById(testDonation._id)
      expect(updatedDonation?.paymentStatus).toBe('SUCCESS')
      expect(updatedDonation?.razorpayPaymentId).toBe('pay_test123')

      // Verify program stats were updated
      const updatedProgram = await Program.findById(testProgram._id)
      expect(updatedProgram?.raisedAmount).toBe(50000)
      expect(updatedProgram?.donationCount).toBe(1)

      // Verify referral code stats were updated
      const updatedReferralCode = await ReferralCode.findById(testReferralCode._id)
      expect(updatedReferralCode?.totalDonations).toBe(1)
      expect(updatedReferralCode?.totalAmount).toBe(50000)
    })

    it('should reject invalid signature', async () => {
      mockRazorpayService.verifyPaymentSignature.mockReturnValue(false)

      const requestBody = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature',
        donationId: testDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await verifyPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Payment verification failed')

      // Verify donation was marked as failed
      const updatedDonation = await Donation.findById(testDonation._id)
      expect(updatedDonation?.paymentStatus).toBe('FAILED')
    })

    it('should handle donation not found', async () => {
      const requestBody = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature',
        donationId: '507f1f77bcf86cd799439011'
      }

      const request = new NextRequest('http://localhost:3000/api/donations/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await verifyPayment(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Donation not found')
    })

    it('should handle already verified payment', async () => {
      // Mark donation as already successful
      testDonation.paymentStatus = 'SUCCESS'
      testDonation.razorpayPaymentId = 'pay_existing'
      await testDonation.save()

      const requestBody = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature',
        donationId: testDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await verifyPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Payment already verified')
      expect(data.data.paymentId).toBe('pay_existing')
    })

    it('should handle order ID mismatch', async () => {
      const requestBody = {
        razorpay_order_id: 'order_different',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature',
        donationId: testDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await verifyPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Order ID mismatch')
    })
  })

  describe('GET /api/donations/[id]', () => {
    let successfulDonation: any
    let pendingDonation: any

    beforeEach(async () => {
      successfulDonation = await Donation.create({
        donorName: 'Successful Donor',
        donorEmail: 'success@example.com',
        amount: 50000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_success',
        razorpayPaymentId: 'pay_success',
        programId: testProgram._id,
        referralCodeId: testReferralCode._id
      })

      pendingDonation = await Donation.create({
        donorName: 'Pending Donor',
        amount: 30000,
        currency: 'INR',
        paymentStatus: 'PENDING',
        razorpayOrderId: 'order_pending'
      })
    })

    it('should fetch successful donation details', async () => {
      const request = new NextRequest(`http://localhost:3000/api/donations/${successfulDonation._id}`)

      const response = await getDonation(request, { params: { id: successfulDonation._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.donationId).toBe(successfulDonation._id.toString())
      expect(data.data.donorName).toBe('Successful Donor')
      expect(data.data.amount).toBe(50000)
      expect(data.data.paymentId).toBe('pay_success')
      expect(data.data.programName).toBe('Test Program')
      expect(data.data.referralCode).toBe('TEST-REF-01')
    })

    it('should not return pending donation details', async () => {
      const request = new NextRequest(`http://localhost:3000/api/donations/${pendingDonation._id}`)

      const response = await getDonation(request, { params: { id: pendingDonation._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Donation not completed')
    })

    it('should handle invalid donation ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/donations/invalid-id')

      const response = await getDonation(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid donation ID format')
    })

    it('should handle non-existent donation', async () => {
      const request = new NextRequest('http://localhost:3000/api/donations/507f1f77bcf86cd799439011')

      const response = await getDonation(request, { params: { id: '507f1f77bcf86cd799439011' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Donation not found')
    })
  })

  describe('POST /api/donations/receipt', () => {
    let successfulDonation: any

    beforeEach(async () => {
      successfulDonation = await Donation.create({
        donorName: 'Receipt Donor',
        donorEmail: 'receipt@example.com',
        amount: 50000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_receipt',
        razorpayPaymentId: 'pay_receipt',
        programId: testProgram._id
      })
    })

    it('should send receipt for successful donation', async () => {
      const requestBody = {
        donationId: successfulDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/receipt', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await sendReceipt(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Receipt sent successfully')
      expect(data.data.donationId).toBe(successfulDonation._id.toString())
      expect(data.data.email).toBe('receipt@example.com')
      expect(data.data.receiptNumber).toMatch(/^ARPU-\d{8}-[A-F0-9]{6}$/)
    })

    it('should handle donation without email', async () => {
      // Create donation without email
      const donationWithoutEmail = await Donation.create({
        donorName: 'No Email Donor',
        amount: 30000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_no_email',
        razorpayPaymentId: 'pay_no_email'
      })

      const requestBody = {
        donationId: donationWithoutEmail._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/receipt', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await sendReceipt(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No email address provided for this donation')
    })

    it('should handle incomplete donation', async () => {
      const pendingDonation = await Donation.create({
        donorName: 'Pending Donor',
        donorEmail: 'pending@example.com',
        amount: 30000,
        currency: 'INR',
        paymentStatus: 'PENDING',
        razorpayOrderId: 'order_pending_receipt'
      })

      const requestBody = {
        donationId: pendingDonation._id.toString()
      }

      const request = new NextRequest('http://localhost:3000/api/donations/receipt', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await sendReceipt(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Cannot send receipt for incomplete donation')
    })
  })


})