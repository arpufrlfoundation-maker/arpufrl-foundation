import { NextRequest } from 'next/server'
import { POST as handleWebhook, GET as healthCheck } from '../../app/api/webhooks/route'
import { Donation } from '../../models/Donation'
import { Program } from '../../models/Program'
import { ReferralCode } from '../../models/ReferralCode'
import { User } from '../../models/User'
import { RazorpayService } from '../../lib/razorpay'
import crypto from 'crypto'

// Mock RazorpayService
jest.mock('../../lib/razorpay', () => ({
  RazorpayService: {
    verifyWebhookSignature: jest.fn(),
    validateWebhookEvent: jest.fn(),
    getPaymentStatusFromWebhook: jest.fn()
  }
}))

const mockRazorpayService = RazorpayService as jest.Mocked<typeof RazorpayService>

describe('/api/webhooks', () => {
  let testUser: any
  let testProgram: any
  let testReferralCode: any
  let testDonation: any

  beforeEach(async () => {
    // Create test data
    testUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@test.com',
      role: 'COORDINATOR',
      status: 'ACTIVE'
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

  describe('GET /api/webhooks', () => {
    it('should return health check response', async () => {
      const response = await healthCheck()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Webhook endpoint is healthy')
      expect(data.timestamp).toBeDefined()
    })
  })

  describe('POST /api/webhooks', () => {
    const createWebhookEvent = (eventType: string, paymentData: any) => ({
      entity: 'event',
      account_id: 'acc_test123',
      event: eventType,
      contains: ['payment'],
      payload: {
        payment: {
          entity: paymentData
        }
      },
      created_at: Date.now()
    })

    const createValidSignature = (body: string) => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret'
      return crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
    }

    describe('payment.captured event', () => {
      it('should process payment captured successfully', async () => {
        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          method: 'card',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          status: 'captured',
          amount: 50000,
          currency: 'INR',
          method: 'card'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.success).toBe(true)
        expect(data.data.message).toBe('Payment captured successfully')

        // Verify donation was updated
        const updatedDonation = await Donation.findById(testDonation._id)
        expect(updatedDonation?.paymentStatus).toBe('SUCCESS')
        expect(updatedDonation?.razorpayPaymentId).toBe('pay_test123')

        // Verify program stats were updated
        const updatedProgram = await Program.findById(testProgram._id)
        expect(updatedProgram?.raisedAmount).toBe(50000)
        expect(updatedProgram?.donationCount).toBe(1)

        // Verify referral code stats were updated
        const updatedReferralCode = await ReferralCode.findById(testReferralCode._id)
        expect(updatedReferralCode?.totalAmount).toBe(50000)
        expect(updatedReferralCode?.totalDonations).toBe(1)
      })

      it('should handle amount mismatch', async () => {
        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 60000, // Different amount
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          status: 'captured',
          amount: 60000,
          currency: 'INR'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.success).toBe(false)
        expect(data.data.message).toBe('Payment amount mismatch')

        // Verify donation was marked as failed
        const updatedDonation = await Donation.findById(testDonation._id)
        expect(updatedDonation?.paymentStatus).toBe('FAILED')
      })

      it('should handle idempotent processing', async () => {
        // Mark donation as already successful
        testDonation.paymentStatus = 'SUCCESS'
        testDonation.razorpayPaymentId = 'pay_test123'
        await testDonation.save()

        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          status: 'captured',
          amount: 50000,
          currency: 'INR'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.message).toBe('Payment already processed')
        expect(data.data.processed).toBe(false)
      })
    })

    describe('payment.failed event', () => {
      it('should process payment failure', async () => {
        const webhookEvent = createWebhookEvent('payment.failed', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'failed',
          order_id: 'order_test123',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          status: 'failed',
          amount: 50000,
          currency: 'INR',
          errorCode: 'BAD_REQUEST_ERROR',
          errorDescription: 'Payment failed'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.message).toBe('Payment failure processed')

        // Verify donation was marked as failed
        const updatedDonation = await Donation.findById(testDonation._id)
        expect(updatedDonation?.paymentStatus).toBe('FAILED')
      })
    })

    describe('refund.created event', () => {
      beforeEach(async () => {
        // Mark donation as successful first
        testDonation.paymentStatus = 'SUCCESS'
        testDonation.razorpayPaymentId = 'pay_test123'
        await testDonation.save()

        // Update program stats
        testProgram.raisedAmount = 50000
        testProgram.donationCount = 1
        await testProgram.save()
      })

      it('should process refund creation', async () => {
        const webhookEvent = createWebhookEvent('refund.created', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'refunded',
          order_id: 'order_test123',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_test123',
          status: 'refunded',
          amount: 50000,
          currency: 'INR'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.message).toBe('Refund processed')

        // Verify donation was marked as refunded
        const updatedDonation = await Donation.findById(testDonation._id)
        expect(updatedDonation?.paymentStatus).toBe('REFUNDED')

        // Verify program stats were updated (amount subtracted)
        const updatedProgram = await Program.findById(testProgram._id)
        expect(updatedProgram?.raisedAmount).toBe(0)
        expect(updatedProgram?.donationCount).toBe(0)
      })
    })

    describe('webhook security', () => {
      it('should reject webhook without signature', async () => {
        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          order_id: 'order_test123'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body: JSON.stringify(webhookEvent),
          headers: { 'content-type': 'application/json' }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Missing signature')
      })

      it('should reject webhook with invalid signature', async () => {
        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          order_id: 'order_test123'
        })

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(false)

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body: JSON.stringify(webhookEvent),
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': 'invalid_signature'
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Invalid signature')
      })

      it('should reject webhook with invalid event format', async () => {
        const invalidEvent = { invalid: 'event' }
        const body = JSON.stringify(invalidEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(null)

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Invalid event format')
      })
    })

    describe('unhandled events', () => {
      it('should acknowledge unhandled event types', async () => {
        const webhookEvent = createWebhookEvent('payment.dispute.created', {
          id: 'pay_test123',
          order_id: 'order_test123'
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.message).toContain('acknowledged but not processed')
      })
    })

    describe('error handling', () => {
      it('should handle donation not found', async () => {
        const webhookEvent = createWebhookEvent('payment.captured', {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_nonexistent',
          created_at: Date.now()
        })

        const body = JSON.stringify(webhookEvent)
        const signature = createValidSignature(body)

        mockRazorpayService.verifyWebhookSignature.mockReturnValue(true)
        mockRazorpayService.validateWebhookEvent.mockReturnValue(webhookEvent)
        mockRazorpayService.getPaymentStatusFromWebhook.mockReturnValue({
          paymentId: 'pay_test123',
          orderId: 'order_nonexistent',
          status: 'captured',
          amount: 50000,
          currency: 'INR'
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks', {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-razorpay-signature': signature
          }
        })

        const response = await handleWebhook(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.success).toBe(false)
        expect(data.data.message).toContain('Donation not found')
      })
    })
  })
})