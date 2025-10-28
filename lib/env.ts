// Environment variable validation and configuration
import { z } from 'zod'

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),

  // NextAuth.js
  NEXTAUTH_SECRET: z.string().min(1, 'NextAuth secret is required'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, 'Razorpay Key ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'Razorpay Key Secret is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'Razorpay Webhook Secret is required'),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url('App URL must be a valid URL'),

  // Optional Email Configuration
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'