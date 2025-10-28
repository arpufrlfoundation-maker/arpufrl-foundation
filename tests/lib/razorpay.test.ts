import { RazorpayService, CreateOrderInput, PaymentVerificationInput, PAYMENT_STATUS } from '../../lib/razorpay'
import crypto from 'crypto'

// Mock Razorpay module
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn(),
      fetch: jest.fn()
    },
    payments: {
      fetch: jest.fn(),
      refund: jest.fn()
    }
  }))
})

describe('RazorpayService', () => {
  const mockRazorpayInstance = {
    orders: {
      create: jest.fn(),
      fetch: jest.fn()
    },
    payments: {
      fetch: jest.fn(),
      refund: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the getInstance method to return our mock
    jest.spyOn(RazorpayService as any, 'getInstance').mockReturnValue(mockRazorpayInstance)
  })

  describe('createOrder', () => {
    it('should create a valid Razorpay order', async () => {
      const mockOrder = {
        id: 'order_test123',
        entity: 'order',
        amount: 50000,
        amount_paid: 0,
        amount_due: 50000,
        currency: 'INR',
        receipt: 'receipt_123',
        offer_id: null,
        status: 'created',
        attempts: 0,
        notes: {},
        created_at: Date.now()
      }

      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder)

      const orderInput: CreateOrderInput = {
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_123'
      }

      const result = await RazorpayService.createOrder(orderInput)

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_123',
        notes: {}
      })
      expect(result).toEqual(mockOrder)
    })

    it('should validate input parameters', async () => {
      const invalidInput = {
        amount: 50, // Below minimum
        currency: 'INR'
      }

      await expect(RazorpayService.createOrder(invalidInput as CreateOrderInput))
        .rejects.toThrow('Failed to create order')
    })

    it('should handle Razorpay API errors', async () => {
      mockRazorpayInstance.orders.create.mockRejectedValue(new Error('API Error'))

      const orderInput: CreateOrderInput = {
        amount: 50000,
        currency: 'INR'
      }

      await expect(RazorpayService.createOrder(orderInput))
        .rejects.toThrow('Failed to create order: API Error')
    })
  })

  describe('verifyPaymentSignature', () => {
    it('should verify valid payment signature', () => {
      const orderId = 'order_test123'
      const paymentId = 'pay_test456'
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret'

      // Generate valid signature
      const signatureString = `${orderId}|${paymentId}`
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(signatureString)
        .digest('hex')

      const input: PaymentVerificationInput = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: expectedSignature
      }

      const result = RazorpayService.verifyPaymentSignature(input)
      expect(result).toBe(true)
    })

    it('should reject invalid payment signature', () => {
      const input: PaymentVerificationInput = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test456',
        razorpay_signature: 'invalid_signature'
      }

      const result = RazorpayService.verifyPaymentSignature(input)
      expect(result).toBe(false)
    })

    it('should handle malformed input gracefully', () => {
      const input = {
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: ''
      } as PaymentVerificationInput

      const result = RazorpayService.verifyPaymentSignature(input)
      expect(result).toBe(false)
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret'

      // Generate valid signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      const result = RazorpayService.verifyWebhookSignature(body, expectedSignature)
      expect(result).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const invalidSignature = 'invalid_signature'

      const result = RazorpayService.verifyWebhookSignature(body, invalidSignature)
      expect(result).toBe(false)
    })
  })

  describe('fetchPayment', () => {
    it('should fetch payment details successfully', async () => {
      const mockPayment = {
        id: 'pay_test123',
        entity: 'payment',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_test456',
        method: 'card'
      }

      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment)

      const result = await RazorpayService.fetchPayment('pay_test123')

      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith('pay_test123')
      expect(result).toEqual(mockPayment)
    })

    it('should handle fetch payment errors', async () => {
      mockRazorpayInstance.payments.fetch.mockRejectedValue(new Error('Payment not found'))

      await expect(RazorpayService.fetchPayment('invalid_payment_id'))
        .rejects.toThrow('Failed to fetch payment: Payment not found')
    })
  })

  describe('validateWebhookEvent', () => {
    it('should validate correct webhook event format', () => {
      const validEvent = {
        entity: 'event',
        account_id: 'acc_test123',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              entity: 'payment',
              amount: 50000,
              currency: 'INR',
              status: 'captured',
              order_id: 'order_test456',
              created_at: Date.now()
            }
          }
        },
        created_at: Date.now()
      }

      const result = RazorpayService.validateWebhookEvent(validEvent)
      expect(result).toEqual(validEvent)
    })

    it('should reject invalid webhook event format', () => {
      const invalidEvent = {
        entity: 'event',
        // Missing required fields
      }

      const result = RazorpayService.validateWebhookEvent(invalidEvent)
      expect(result).toBeNull()
    })
  })

  describe('getPaymentStatusFromWebhook', () => {
    it('should extract payment status from valid webhook', () => {
      const webhookEvent = {
        entity: 'event',
        account_id: 'acc_test123',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              entity: 'payment',
              amount: 50000,
              currency: 'INR',
              status: 'captured',
              order_id: 'order_test456',
              method: 'card',
              email: 'test@example.com',
              contact: '+919876543210',
              created_at: Date.now()
            }
          }
        },
        created_at: Date.now()
      }

      const result = RazorpayService.getPaymentStatusFromWebhook(webhookEvent)

      expect(result).toEqual({
        paymentId: 'pay_test123',
        orderId: 'order_test456',
        status: 'captured',
        amount: 50000,
        currency: 'INR',
        method: 'card',
        email: 'test@example.com',
        contact: '+919876543210',
        errorCode: undefined,
        errorDescription: undefined
      })
    })

    it('should handle malformed webhook event', () => {
      const malformedEvent = {
        entity: 'event',
        payload: {}
      } as any

      const result = RazorpayService.getPaymentStatusFromWebhook(malformedEvent)
      expect(result).toBeNull()
    })
  })

  describe('createRefund', () => {
    it('should create refund successfully', async () => {
      const mockRefund = {
        id: 'rfnd_test123',
        entity: 'refund',
        amount: 25000,
        currency: 'INR',
        payment_id: 'pay_test456',
        status: 'processed'
      }

      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRefund)

      const result = await RazorpayService.createRefund('pay_test456', 25000, { reason: 'customer_request' })

      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_test456', {
        amount: 25000,
        notes: { reason: 'customer_request' }
      })
      expect(result).toEqual(mockRefund)
    })

    it('should handle refund creation errors', async () => {
      mockRazorpayInstance.payments.refund.mockRejectedValue(new Error('Refund failed'))

      await expect(RazorpayService.createRefund('invalid_payment_id'))
        .rejects.toThrow('Failed to create refund: Refund failed')
    })
  })
})