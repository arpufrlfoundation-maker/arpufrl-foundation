/**
 * Health Check API Endpoint
 * Verifies all critical system components are working
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
    env: {
      nodeEnv: string
      hasRequiredVars: boolean
      missingVars?: string[]
    }
  }
  version?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'down' },
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      env: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasRequiredVars: false
      }
    }
  }

  // Check database
  try {
    const dbStartTime = Date.now()
    await connectToDatabase()

    if (mongoose.connection.readyState === 1) {
      // Perform a simple query to verify database is responsive
      await mongoose.connection.db?.admin().ping()

      result.checks.database = {
        status: 'up',
        responseTime: Date.now() - dbStartTime
      }
    } else {
      result.checks.database = {
        status: 'down',
        error: 'Database not connected'
      }
      result.status = 'unhealthy'
    }
  } catch (error) {
    result.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    result.status = 'unhealthy'
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  result.checks.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  }

  // Warn if memory usage is high
  if (result.checks.memory.percentage > 90) {
    result.status = result.status === 'unhealthy' ? 'unhealthy' : 'degraded'
  }

  // Check required environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'APP_URL'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  result.checks.env = {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    hasRequiredVars: missingVars.length === 0,
    ...(missingVars.length > 0 && { missingVars })
  }

  if (missingVars.length > 0) {
    result.status = 'degraded'
  }

  // Add version if available
  try {
    const packageJson = require('../../../package.json')
    result.version = packageJson.version
  } catch {
    // Package.json not found, skip version
  }

  // Return appropriate status code
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503

  return NextResponse.json(result, { status: statusCode })
}
