/**
 * API Route Handler Wrapper
 * Provides consistent error handling, logging, and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'
import { rateLimit, getClientIdentifier, rateLimiters } from './rate-limit'
import { ZodError } from 'zod'

export interface ApiHandlerOptions {
  rateLimit?: ReturnType<typeof rateLimit>
  requireAuth?: boolean
  allowedRoles?: string[]
}

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse | Response>

/**
 * Wraps an API handler with error handling, logging, and rate limiting
 */
export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now()
    const method = request.method
    const url = request.url

    try {
      // Rate limiting
      if (options.rateLimit) {
        const identifier = getClientIdentifier(request)
        const result = options.rateLimit.check(identifier)

        if (!result.success) {
          logger.warn('Rate limit exceeded', {
            identifier,
            url,
            reset: result.reset
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Too many requests',
              message: 'Please try again later',
              retryAfter: result.reset
            },
            {
              status: 429,
              headers: {
                'Retry-After': result.reset ? Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString() : '60',
                'X-RateLimit-Limit': result.limit?.toString() || '0',
                'X-RateLimit-Remaining': result.remaining?.toString() || '0',
                'X-RateLimit-Reset': result.reset?.toISOString() || ''
              }
            }
          )
        }

        // Add rate limit headers to response
        const response = await handler(request, context)

        if (response instanceof NextResponse) {
          result.limit && response.headers.set('X-RateLimit-Limit', result.limit.toString())
          result.remaining !== undefined && response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
          result.reset && response.headers.set('X-RateLimit-Reset', result.reset.toISOString())
        }

        return response
      }

      // Execute handler
      const response = await handler(request, context)

      // Log successful requests
      const duration = Date.now() - startTime
      logger.info('API request completed', {
        method,
        url,
        duration,
        status: response instanceof NextResponse ? response.status : 200
      })

      return response

    } catch (error) {
      const duration = Date.now() - startTime

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          method,
          url,
          errors: error.issues
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }

      // Handle known errors with status codes
      if (error instanceof ApiError) {
        logger.error('API error', error, {
          method,
          url,
          duration,
          statusCode: error.statusCode
        })

        return NextResponse.json(
          {
            success: false,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
          },
          { status: error.statusCode }
        )
      }

      // Handle unexpected errors
      logger.error('Unexpected API error', error instanceof Error ? error : new Error(String(error)), {
        method,
        url,
        duration
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : String(error))
            : 'An unexpected error occurred',
          ...(process.env.NODE_ENV === 'development' && error instanceof Error && { stack: error.stack })
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Common API errors
 */
export const ApiErrors = {
  Unauthorized: () => new ApiError('Unauthorized', 401, 'UNAUTHORIZED'),
  Forbidden: () => new ApiError('Forbidden', 403, 'FORBIDDEN'),
  NotFound: (resource = 'Resource') => new ApiError(`${resource} not found`, 404, 'NOT_FOUND'),
  BadRequest: (message = 'Bad request') => new ApiError(message, 400, 'BAD_REQUEST'),
  Conflict: (message = 'Resource already exists') => new ApiError(message, 409, 'CONFLICT'),
  TooManyRequests: () => new ApiError('Too many requests', 429, 'TOO_MANY_REQUESTS'),
  InternalError: (message = 'Internal server error') => new ApiError(message, 500, 'INTERNAL_ERROR')
}

/**
 * Helper to create standard success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

/**
 * Helper to create standard error response
 */
export function errorResponse(message: string, status = 500, details?: any): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * Export rate limiters for convenience
 */
export { rateLimiters } from './rate-limit'
