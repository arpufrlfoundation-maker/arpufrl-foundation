import { UserRole, UserStatus, type UserRoleType, type UserStatusType } from '../models/User'
import { env } from './env'

// Demo admin configuration interface
export interface DemoAdminConfig {
  email: string
  password: string
  name: string
  role: UserRoleType
  status: UserStatusType
  isDemoAccount: boolean
}

// Demo admin credentials - fallback values
const DEMO_ADMIN_FALLBACK = {
  email: 'admin@arpufrl.demo',
  password: 'DemoAdmin@2025',
  name: 'Demo Administrator',
  role: UserRole.ADMIN as UserRoleType,
  status: UserStatus.ACTIVE as UserStatusType,
  isDemoAccount: true
} as const

/**
 * Get demo admin configuration with environment variable fallback
 * Priority: Environment variables > Hard-coded fallback
 */
export const getDemoAdminConfig = (): DemoAdminConfig => {
  // Check for environment variables first
  if (process.env.DEMO_ADMIN_EMAIL && process.env.DEMO_ADMIN_PASSWORD) {
    return {
      email: process.env.DEMO_ADMIN_EMAIL,
      password: process.env.DEMO_ADMIN_PASSWORD,
      name: process.env.DEMO_ADMIN_NAME || 'Demo Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isDemoAccount: true
    }
  }

  // Fallback to hard-coded credentials
  return DEMO_ADMIN_FALLBACK
}

/**
 * Validate demo admin credentials
 */
export const validateDemoAdminCredentials = (email: string, password: string): boolean => {
  const demoConfig = getDemoAdminConfig()
  return email === demoConfig.email && password === demoConfig.password
}

/**
 * Check if an email belongs to the demo admin account
 */
export const isDemoAdmin = (email: string): boolean => {
  const demoConfig = getDemoAdminConfig()
  return email === demoConfig.email
}

/**
 * Check if a user ID belongs to the demo admin account
 */
export const isDemoAdminById = (userId: string): boolean => {
  return userId === 'demo-admin'
}

/**
 * Get demo admin user object for authentication
 */
export const getDemoAdminUser = () => {
  const config = getDemoAdminConfig()
  return {
    id: 'demo-admin',
    name: config.name,
    email: config.email,
    role: config.role,
    status: config.status,
    isDemoAccount: true
  }
}

/**
 * Get demo admin session data
 */
export const getDemoAdminSession = () => {
  const config = getDemoAdminConfig()
  return {
    user: {
      id: 'demo-admin',
      name: config.name,
      email: config.email,
      role: config.role,
      status: config.status,
      isDemoAccount: true
    }
  }
}

/**
 * Validate demo admin configuration on startup
 */
export const validateDemoAdminConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const config = getDemoAdminConfig()

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(config.email)) {
    errors.push('Demo admin email format is invalid')
  }

  // Validate password strength
  if (config.password.length < 8) {
    errors.push('Demo admin password must be at least 8 characters')
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(config.password)) {
    errors.push('Demo admin password must contain uppercase, lowercase, and number')
  }

  // Validate name
  if (!config.name || config.name.trim().length < 2) {
    errors.push('Demo admin name must be at least 2 characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log demo admin configuration status (without sensitive data)
 */
export const logDemoAdminStatus = (): void => {
  const config = getDemoAdminConfig()
  const validation = validateDemoAdminConfig()

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Demo Admin Configuration Status:', {
      email: config.email,
      name: config.name,
      role: config.role,
      status: config.status,
      source: process.env.DEMO_ADMIN_EMAIL ? 'environment' : 'fallback',
      isValid: validation.isValid,
      errors: validation.errors
    })
  }
}

// Demo admin utility functions
export const demoAdminUtils = {
  getDemoAdminConfig,
  validateDemoAdminCredentials,
  isDemoAdmin,
  isDemoAdminById,
  getDemoAdminUser,
  getDemoAdminSession,
  validateDemoAdminConfig,
  logDemoAdminStatus
}