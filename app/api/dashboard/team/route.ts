/**
 * Team/Network API
 * Provides team members, subordinates, and network statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { getTeamMembers, getHierarchyTree, getAllSubordinates } from '@/lib/hierarchy-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/team
 * Fetch team members with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const directOnly = searchParams.get('directOnly') === 'true'
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined
    const view = searchParams.get('view') || 'list' // list or tree

    if (view === 'tree') {
      // Return hierarchical tree structure
      const tree = await getHierarchyTree(session.user.id)
      return NextResponse.json({
        success: true,
        data: {
          tree
        }
      })
    }

    // Return flat list with pagination
    const result = await getTeamMembers(session.user.id, {
      page,
      limit,
      directOnly,
      role: role as any,
      status
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Team API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
