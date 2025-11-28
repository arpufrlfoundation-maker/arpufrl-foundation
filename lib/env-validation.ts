/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Email (optional but recommended)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  APP_URL: z.string().url('Invalid APP_URL').optional(),

  // Optional
  DEMO_ADMIN_EMAIL: z.string().optional(),
  DEMO_ADMIN_PASSWORD: z.string().optional(),
  DEMO_ADMIN_NAME: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env)

    // Additional production checks
    if (env.NODE_ENV === 'production') {
      // Check for test/demo values in production
      if (env.NEXTAUTH_SECRET.includes('development') || env.NEXTAUTH_SECRET.includes('test')) {
        throw new Error('⚠️  CRITICAL: Using development NEXTAUTH_SECRET in production!')
      }

      if (env.RAZORPAY_KEY_ID.startsWith('rzp_test')) {
        console.warn('⚠️  WARNING: Using Razorpay TEST keys in production mode')
      }

      if (env.MONGODB_URI.includes('localhost') || env.MONGODB_URI.includes('127.0.0.1')) {
        throw new Error('⚠️  CRITICAL: Using localhost database in production!')
      }

      // Warn about missing email configuration
      if (!env.EMAIL_SERVER_HOST || !env.EMAIL_SERVER_USER) {
        console.warn('⚠️  WARNING: Email configuration missing in production')
      }
    }

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Invalid environment variables. Check .env file.')
    }
    throw error
  }
}

// Validate on module load
export const env = validateEnv()

// Export helper functions
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}
