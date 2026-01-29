import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Blog, blogUpdateSchema } from '@/models/Blog'
import { auth } from '@/lib/auth'
import { UserRole } from '@/models/User'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit } from '@/lib/rate-limit'
import mongoose from 'mongoose'

// Rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 30
})

// GET /api/blogs/[slug] - Get single blog by slug
export const GET = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      const { slug } = await params

      await connectToDatabase()

      const blog = await Blog.findOne({ slug })
        .populate('author', 'name email profilePhoto')

      if (!blog) {
        return NextResponse.json(
          { success: false, error: 'Blog not found' },
          { status: 404 }
        )
      }

      // Check if blog is published or user is admin
      if (!blog.published) {
        const session = await auth()
        if (!session?.user || session.user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Blog not found' },
            { status: 404 }
          )
        }
      }

      // Increment view count
      await Blog.incrementView(blog._id.toString())

      return NextResponse.json({
        success: true,
        data: blog
      })
    } catch (error) {
      console.error('Error fetching blog:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch blog',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)

// PUT /api/blogs/[slug] - Update blog (admin only)
export const PUT = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      // Authentication check
      const session = await auth()

      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Please login' },
          { status: 401 }
        )
      }

      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      const { slug } = await params

      await connectToDatabase()

      const body = await request.json()

      // Validate input
      const validationResult = blogUpdateSchema.safeParse(body)
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

      // Check if new slug already exists (if slug is being changed)
      if (validationResult.data.slug && validationResult.data.slug !== slug) {
        const existingBlog = await Blog.findOne({ slug: validationResult.data.slug })
        if (existingBlog) {
          return NextResponse.json(
            { success: false, error: 'Blog with this slug already exists' },
            { status: 400 }
          )
        }
      }

      const blog = await Blog.findOneAndUpdate(
        { slug },
        { $set: validationResult.data },
        { new: true, runValidators: true }
      ).populate('author', 'name email profilePhoto')

      if (!blog) {
        return NextResponse.json(
          { success: false, error: 'Blog not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Blog updated successfully',
        data: blog
      })
    } catch (error) {
      console.error('Error updating blog:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update blog',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)

// DELETE /api/blogs/[slug] - Delete blog (admin only)
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      // Authentication check
      const session = await auth()

      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Please login' },
          { status: 401 }
        )
      }

      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      const { slug } = await params

      await connectToDatabase()

      const blog = await Blog.findOneAndDelete({ slug })

      if (!blog) {
        return NextResponse.json(
          { success: false, error: 'Blog not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Blog deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting blog:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete blog',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)
