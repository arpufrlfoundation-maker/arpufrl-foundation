import Razorpay from 'razorpay'
import crypto from 'crypto'
import { env } from './env'
import { z } from 'zod'

// Razorpay order creation schema
export const CreateOrderSchema = z.object({
  amount: z.number().min(100).max(10000000), // ₹1 to ₹100,000 in paise
  currency: z.string().default('INR'),
  receipt: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
})

// Payment verification schema
export const PaymentVerificationSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

// Webhook event schema
export const WebhookEventSchema = z.object({
  entity: z.string(),
  account_id: z.string(),
  event: z.string(),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().optional(),
        invoice_id: z.string().optional(),
        international: z.boolean().optional(),
        method: z.string().optional(),
        amount_refunded: z.number().optional(),
        refund_status: z.string().optional(),
        captured: z.boolean().optional(),
        description: z.string().optional(),
        card_id: z.string().optional(),
        bank: z.string().optional(),
        wallet: z.string().optional(),
        vpa: z.string().optional(),
        email: z.string().optional(),
        contact: z.string().optional(),
        notes: z.record(z.string(), z.string()).optional(),
        fee: z.number().optional(),
        tax: z.number().optional(),
        error_code: z.string().optional(),
        error_description: z.string().optional(),
        error_source: z.string().optional(),
        error_step: z.string().optional(),
        error_reason: z.string().optional(),
        acquirer_data: z.record(z.string(), z.any()).optional(),
        created_at: z.number(),
      }),
    }),
  }),
  created_at: z.number(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type PaymentVerificationInput = z.infer<typeof PaymentVerificationSchema>
export type WebhookEvent = z.infer<typeof WebhookEventSchema>

// Razorpay service class
export class RazorpayService {
  private static instance: Razorpay | null = null

  // Get Razorpay instance (singleton pattern)
  private static getInstance(): Razorpay {
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      })
    }
    return this.instance
  }

  // Create a new order
  static async createOrder(input: CreateOrderInput): Promise<{
    id: string
    entity: string
    amount: number
    amount_paid: number
    amount_due: number
    currency: string
    receipt: string | null
    offer_id: string | null
    status: string
    attempts: number
    notes: Record<string, string>
    created_at: number
  }> {
    try {
      // Validate input
      const validatedInput = CreateOrderSchema.parse(input)

      const razorpay = this.getInstance()

      // Create order with Razorpay
      const order = await razorpay.orders.create({
        amount: validatedInput.amount,
        currency: validatedInput.currency,
        receipt: validatedInput.receipt || `receipt_${Date.now()}`,
        notes: validatedInput.notes || {},
      })

      return order
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(input: PaymentVerificationInput): boolean {
    try {
      // Validate input
      const validatedInput = PaymentVerificationSchema.parse(input)

      // Create signature string
      const signatureString = `${validatedInput.razorpay_order_id}|${validatedInput.razorpay_payment_id}`

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(signatureString)
        .digest('hex')

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(validatedInput.razorpay_signature, 'hex')
      )
    } catch (error) {
      console.error('Error verifying payment signature:', error)
      return false
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      )
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Fetch payment details
  static async fetchPayment(paymentId: string): Promise<any> {
    try {
      const razorpay = this.getInstance()
      const payment = await razorpay.payments.fetch(paymentId)
      return payment
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Fetch order details
  static async fetchOrder(orderId: string): Promise<any> {
    try {
      const razorpay = this.getInstance()
      const order = await razorpay.orders.fetch(orderId)
      return order
    } catch (error) {
      console.error('Error fetching order:', error)
      throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Process refund
  static async createRefund(paymentId: string, amount?: number, notes?: Record<string, string>): Promise<any> {
    try {
      const razorpay = this.getInstance()
      const refund = await razorpay.payments.refund(paymentId, {
        amount,
        notes,
      })
      return refund
    } catch (error) {
      console.error('Error creating refund:', error)
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate webhook event
  static validateWebhookEvent(body: any): WebhookEvent | null {
    try {
      return WebhookEventSchema.parse(body)
    } catch (error) {
      console.error('Invalid webhook event format:', error)
      return null
    }
  }

  // Get payment status from webhook event
  static getPaymentStatusFromWebhook(event: WebhookEvent): {
    paymentId: string
    orderId?: string
    status: string
    amount: number
    currency: string
    method?: string
    email?: string
    contact?: string
    errorCode?: string
    errorDescription?: string
  } | null {
    try {
      const payment = event.payload.payment.entity

      return {
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
      }
    } catch (error) {
      console.error('Error extracting payment status from webhook:', error)
      return null
    }
  }
}

// Payment status constants
export const PAYMENT_STATUS = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const

// Error handling utilities
export class RazorpayError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string,
    public source?: string
  ) {
    super(message)
    this.name = 'RazorpayError'
  }
}

// Helper function to handle Razorpay API errors
export function handleRazorpayError(error: any): RazorpayError {
  if (error.error) {
    return new RazorpayError(
      error.error.description || error.error.reason || 'Razorpay API error',
      error.error.code,
      error.error.field,
      error.error.source
    )
  }

  return new RazorpayError(
    error.message || 'Unknown Razorpay error',
    'UNKNOWN_ERROR'
  )
}