import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole, UserStatus } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get current user
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get team members (subordinates in hierarchy - users who have this user as parent coordinator)
    let teamMembers = await User.find({
      parentCoordinatorId: session.user.id,
      status: UserStatus.ACTIVE
    }).select('name email role state district zone block').lean()

    // If no team members found, fetch STATE_PRESIDENT users as fallback
    if (teamMembers.length === 0) {
      teamMembers = await User.find({
        role: UserRole.STATE_PRESIDENT,
        status: UserStatus.ACTIVE
      }).select('name email role state district zone block').lean()
    }

    return NextResponse.json({
      teamMembers: teamMembers.map(member => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        level: member.role // For backward compatibility
      }))
    })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
