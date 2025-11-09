import NextAuth, { NextAuthConfig, User as NextAuthUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { connectToDatabase } from './db'
import { User, userLoginSchema, UserRole, UserStatus, type IUser } from '../models/User'
import { env } from './env'
import bcrypt from 'bcryptjs'
import {
  validateDemoAdminCredentials,
  getDemoAdminUser,
  isDemoAdmin,
  isDemoAdminById,
  logDemoAdminStatus
} from './demo-admin'

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    region?: string
    parentCoordinatorId?: string
    isDemoAccount?: boolean
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      status: string
      region?: string
      parentCoordinatorId?: string
      isDemoAccount?: boolean
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: string
    status: string
    region?: string
    parentCoordinatorId?: string
    isDemoAccount?: boolean
  }
}

// NextAuth configuration
export const authConfig: NextAuthConfig = {
  // Note: MongoDB adapter disabled for Edge Runtime compatibility
  // adapter: MongoDBAdapter(connectToDatabase()),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        try {
          // Validate input
          const validatedFields = userLoginSchema.safeParse(credentials)
          if (!validatedFields.success) {
            return null
          }

          const { email, password } = validatedFields.data

          // Check for demo admin first
          if (validateDemoAdminCredentials(email, password)) {
            console.log('Demo admin login successful:', email)
            return getDemoAdminUser()
          }

          // Connect to database for regular user authentication
          await connectToDatabase()

          // Find user by email
          const user = await User.findByEmail(email)
          if (!user) {
            return null
          }

          // Check if user is active
          if (user.status !== UserStatus.ACTIVE) {
            return null
          }

          // Verify password
          const isValidPassword = await user.comparePassword(password)
          if (!isValidPassword) {
            return null
          }

          // Return user object for NextAuth
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            region: user.region,
            parentCoordinatorId: user.parentCoordinatorId?.toString(),
            isDemoAccount: false
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 60, // 30 minutes
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.region = user.region
        token.parentCoordinatorId = user.parentCoordinatorId
        token.isDemoAccount = user.isDemoAccount
      }

      // Update session trigger (for profile updates)
      if (trigger === 'update' && session) {
        token.name = session.user.name
        token.email = session.user.email
        token.role = session.user.role
        token.status = session.user.status
        token.region = session.user.region
        token.parentCoordinatorId = session.user.parentCoordinatorId
        token.isDemoAccount = session.user.isDemoAccount
      }

      // Skip database verification for demo admin
      if (token.isDemoAccount) {
        return token
      }

      // Verify user is still active on each request (regular users only)
      if (token.id) {
        try {
          await connectToDatabase()
          const user = await User.findById(token.id)
          if (!user || user.status !== UserStatus.ACTIVE) {
            return {}
          }

          // Update token with latest user data
          token.name = user.name
          token.email = user.email
          token.role = user.role
          token.status = user.status
          token.region = user.region
          token.parentCoordinatorId = user.parentCoordinatorId?.toString()
        } catch (error) {
          console.error('JWT callback error:', error)
          return {}
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = (token.name as string) || ''
        session.user.email = (token.email as string) || ''
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.region = token.region as string | undefined
        session.user.parentCoordinatorId = token.parentCoordinatorId as string | undefined
        session.user.isDemoAccount = token.isDemoAccount as boolean | undefined
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Only allow credentials provider
      if (account?.provider !== 'credentials') {
        return false
      }

      // Additional security checks can be added here
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (user.isDemoAccount) {
        console.log(`Demo admin signed in: ${user.email}`)
      } else {
        console.log(`User signed in: ${user.email}`)
      }
    },
    async signOut() {
      console.log('User signed out')
    },
    async session({ session, token }) {
      // Session is active - can be used for logging/analytics
    }
  },
  debug: env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET,
}

// Export NextAuth instance
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Log demo admin status on startup
if (typeof window === 'undefined') {
  // Only run on server side
  logDemoAdminStatus()
}

// Utility functions for authentication
export const authUtils = {
  /**
   * Check if user has required role
   */
  hasRole: (userRole: string, requiredRoles: string[]): boolean => {
    return requiredRoles.includes(userRole)
  },

  /**
   * Check if user is admin
   */
  isAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },

  /**
   * Check if user is coordinator or above
   */
  isCoordinator: (userRole: string): boolean => {
    return [UserRole.ADMIN, UserRole.COORDINATOR].includes(userRole as any)
  },

  /**
   * Check if user can access admin features
   */
  canAccessAdmin: (userRole: string): boolean => {
    return userRole === UserRole.ADMIN
  },

  /**
   * Check if user can access coordinator features
   */
  canAccessCoordinator: (userRole: string): boolean => {
    return [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR].includes(userRole as any)
  },

  /**
   * Get redirect URL based on user role
   */
  getRedirectUrl: (userRole: string): string => {
    switch (userRole) {
      case UserRole.ADMIN:
        return '/dashboard/admin'
      case UserRole.COORDINATOR:
      case UserRole.SUB_COORDINATOR:
        return '/dashboard/coordinator'
      default:
        return '/'
    }
  }
}