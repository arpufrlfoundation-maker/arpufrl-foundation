import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { User, UserRole } from '../../../../../models/User'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch recent users
    const users = await User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString()
    }))

    return NextResponse.json({
      users: formattedUsers,
      total: users.length
    })

  } catch (error) {
    console.error('Recent users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    )
  }
}