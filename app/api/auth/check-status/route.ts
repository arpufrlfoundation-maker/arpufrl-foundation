import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { isDemoAdmin, validateDemoAdminCredentials, getDemoAdminUser } from '@/lib/demo-admin'

/**
 * Check user status before attempting login
 * Returns user status to determine if they can log in or if they're pending approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if this is a demo admin login attempt
    if (isDemoAdmin(email)) {
      const isValidDemoAdmin = validateDemoAdminCredentials(email, password)

      if (!isValidDemoAdmin) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Demo admin is always active
      const demoAdmin = getDemoAdminUser()
      return NextResponse.json(
        {
          status: 'ACTIVE',
          message: 'Demo admin can proceed to login',
          user: {
            id: demoAdmin.id,
            name: demoAdmin.name,
            email: demoAdmin.email,
            role: demoAdmin.role,
          }
        },
        { status: 200 }
      )
    }

    // Connect to database for regular users
    await connectToDatabase()

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase())

    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Password is correct, now check status
    if (user.status === 'PENDING') {
      return NextResponse.json(
        {
          status: 'PENDING',
          message: 'Your account is pending approval from your higher coordinator',
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
        { status: 403 }
      )
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          status: 'SUSPENDED',
          message: 'Your account has been suspended. Please contact support.',
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
        { status: 403 }
      )
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json(
        {
          status: 'INACTIVE',
          message: 'Your account is inactive. Please contact your coordinator.',
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
        { status: 403 }
      )
    }

    // Status is ACTIVE - user can proceed to login
    return NextResponse.json(
      {
        status: 'ACTIVE',
        message: 'User can proceed to login',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          region: user.region,
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
