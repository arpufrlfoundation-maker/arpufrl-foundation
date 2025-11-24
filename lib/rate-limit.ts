/**
 * Rate Limiting Utility for API Routes
 * Prevents abuse and DDoS attacks
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Cleanup every minute

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (identifier: string): { success: boolean; limit?: number; remaining?: number; reset?: Date } => {
      const now = Date.now()
      const key = identifier

      // Initialize or get existing record
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + config.windowMs
        }
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: new Date(store[key].resetTime)
        }
      }

      // Increment count
      store[key].count++

      // Check if limit exceeded
      if (store[key].count > config.maxRequests) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          reset: new Date(store[key].resetTime)
        }
      }

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - store[key].count,
        reset: new Date(store[key].resetTime)
      }
    }
  }
}

// Preset configurations
export const rateLimiters = {
  // Strict rate limit for sensitive operations (e.g., login, password reset)
  strict: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),

  // Moderate rate limit for API endpoints
  moderate: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  }),

  // Lenient rate limit for public endpoints
  lenient: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200
  }),

  // Payment operations rate limit
  payment: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50
  })
}

// Helper to extract IP from request
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  return 'unknown'
}
