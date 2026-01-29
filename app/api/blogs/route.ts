import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Blog, blogValidationSchema } from '@/models/Blog'
import { auth } from '@/lib/auth'
import { UserRole } from '@/models/User'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiters
const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100
})

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20
})

// GET /api/blogs - Fetch blogs (public or admin)
export const GET = withApiHandler(
  async (request: NextRequest) => {
    try {
      await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')
      const tag = searchParams.get('tag')
      const isAdmin = searchParams.get('admin') === 'true'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')

      // Build filter query
      const filter: Record<string, unknown> = {}

      // For admin view, check authentication
      if (isAdmin) {
        const session = await auth()
        if (!session?.user || session.user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          )
        }
        // Admins can see all blogs
      } else {
        // Public view - only show published blogs
        filter.published = true
      }

      // Category filter
      if (category) {
        filter.category = category
      }

      // Tag filter
      if (tag) {
        filter.tags = { $in: [tag] }
      }

      // Calculate pagination
      const skip = (page - 1) * limit
      const total = await Blog.countDocuments(filter)

      // Fetch blogs
      const blogs = await Blog.find(filter)
        .select('title slug excerpt featuredImage category tags published views createdAt author metaTitle metaDescription')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email profilePhoto')

      // Get unique categories and tags
      const categories = await Blog.distinct('category', { published: true })
      const allTags = await Blog.distinct('tags', { published: true })

      return NextResponse.json({
        success: true,
        data: {
          blogs,
          categories,
          tags: allTags,
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
      console.error('Error fetching blogs:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch blogs',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: readRateLimiter }
)

// POST /api/blogs - Create new blog (admin only)
export const POST = withApiHandler(
  async (request: NextRequest) => {
    try {
      // Authentication check
      const session = await auth()

      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Please login' },
          { status: 401 }
        )
      }

      // Admin role check
      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      await connectToDatabase()

      const body = await request.json()

      // Validate input
      const validationResult = blogValidationSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validationResult.error.issues
          },
          { status: 400 }
        )
      }

      const { title, slug, excerpt, content, featuredImage, category, tags, published, metaTitle, metaDescription } = validationResult.data

      // Check if slug is unique
      const existingBlog = await Blog.findOne({ slug })
      if (existingBlog) {
        return NextResponse.json(
          { success: false, error: 'Blog with this slug already exists' },
          { status: 400 }
        )
      }

      // Handle author - for demo admin, set to null since it's not a real ObjectId
      const authorId = session.user.isDemoAccount ? null : session.user.id

      // Create blog
      const blog = await Blog.create({
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        category,
        tags: tags || [],
        published,
        metaTitle,
        metaDescription,
        author: authorId
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Blog created successfully',
          data: blog
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error creating blog:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create blog',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: writeRateLimiter }
)
