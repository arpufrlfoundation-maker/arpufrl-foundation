import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { connectToDatabase } from '../../../../lib/db'
import { UserRole } from '../../../../models/User'
import { Program } from '../../../../models/Program'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Filter parameters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const featured = searchParams.get('featured') || ''

    // Build filter query
    const filter: any = {}

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ]
    }

    // Status filter
    if (status === 'active') {
      filter.active = true
    } else if (status === 'inactive') {
      filter.active = false
    }

    // Featured filter
    if (featured === 'featured') {
      filter.featured = true
    } else if (featured === 'not-featured') {
      filter.featured = false
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get programs with pagination
    const [programs, totalCount] = await Promise.all([
      Program.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Program.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Format response
    const formattedPrograms = programs.map((program: any) => ({
      id: program._id.toString(),
      name: program.name,
      slug: program.slug,
      description: program.description,
      longDescription: program.longDescription,
      image: program.image,
      gallery: program.gallery,
      targetAmount: program.targetAmount,
      raisedAmount: program.raisedAmount,
      donationCount: program.donationCount,
      active: program.active,
      featured: program.featured,
      priority: program.priority,
      metaTitle: program.metaTitle,
      metaDescription: program.metaDescription,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString()
    }))

    return NextResponse.json({
      programs: formattedPrograms,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Programs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate required fields
    const { name, description } = body
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    // Generate slug from name if not provided
    let slug = body.slug
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
    }

    // Check if slug is unique
    const existingProgram = await Program.findOne({ slug })
    if (existingProgram) {
      return NextResponse.json(
        { error: 'A program with this slug already exists' },
        { status: 400 }
      )
    }

    // Create new program
    const programData = {
      name,
      slug,
      description,
      longDescription: body.longDescription,
      image: body.image,
      gallery: body.gallery || [],
      targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : undefined,
      raisedAmount: 0,
      donationCount: 0,
      active: body.active !== undefined ? body.active : true,
      featured: body.featured !== undefined ? body.featured : false,
      priority: body.priority ? parseInt(body.priority) : 0,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription
    }

    const program = new Program(programData)
    await program.save()

    return NextResponse.json({
      message: 'Program created successfully',
      program: {
        id: program._id.toString(),
        name: program.name,
        slug: program.slug,
        description: program.description,
        active: program.active,
        featured: program.featured,
        createdAt: program.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}