import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Program } from '@/models/Program'

// GET /api/programs - Fetch active programs for donation form
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter query
    const filter: any = {}

    // Only show active programs by default
    if (active !== 'false') {
      filter.active = true
    }

    if (featured === 'true') {
      filter.featured = true
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const total = await Program.countDocuments(filter)

    // Fetch programs
    const programs = await Program.find(filter)
      .select('name slug description longDescription image targetAmount raisedAmount donationCount active featured priority category')
      .sort({ priority: -1, featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: {
        programs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch programs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/programs - Create new program (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    // TODO: Add authentication check for admin role
    // For now, return method not allowed
    return NextResponse.json(
      { success: false, error: 'Method not implemented' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create program',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}