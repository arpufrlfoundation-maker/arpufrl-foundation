import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { GalleryImage, galleryUploadSchema, GalleryCategory } from '@/models/Gallery'
import { auth } from '@/lib/auth'
import { UserRole } from '@/models/User'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiter for gallery uploads (more restrictive)
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 uploads per minute
})

// Rate limiter for reads
const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100
})

// GET /api/gallery - Fetch gallery images (public or admin)
export const GET = withApiHandler(
  async (request: NextRequest) => {
    try {
      await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')
      const isAdmin = searchParams.get('admin') === 'true'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '24')

      // Build filter query
      const filter: Record<string, unknown> = {}

      // Category filter
      if (category && Object.values(GalleryCategory).includes(category as typeof GalleryCategory[keyof typeof GalleryCategory])) {
        filter.category = category
      }

      // For admin view, check authentication
      if (isAdmin) {
        const session = await auth()
        if (!session?.user || session.user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          )
        }
        // Admins can see all images
      } else {
        // Public view - only show public images
        filter.isPublic = true
      }

      // Calculate pagination
      const skip = (page - 1) * limit
      const total = await GalleryImage.countDocuments(filter)

      // Fetch images
      const images = await GalleryImage.find(filter)
        .select('title description altText imageUrl thumbnailUrl category isPublic order width height createdAt')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email')

      return NextResponse.json({
        success: true,
        data: {
          images,
          categories: Object.values(GalleryCategory),
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
      console.error('Error fetching gallery images:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch gallery images',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: readRateLimiter }
)

// POST /api/gallery - Upload new image (admin only)
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
      const validationResult = galleryUploadSchema.safeParse(body)
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

      const { title, description, altText, category, isPublic, imageUrl } = validationResult.data

      // Get the highest order value for placement
      const maxOrderImage = await GalleryImage.findOne().sort({ order: -1 }).select('order')
      const newOrder = (maxOrderImage?.order || 0) + 1

      // Handle uploadedBy - for demo admin, set to null since it's not a real ObjectId
      const uploadedById = session.user.isDemoAccount ? null : session.user.id

      // Create gallery image
      const galleryImage = await GalleryImage.create({
        title,
        description,
        altText,
        imageUrl,
        thumbnailUrl: generateThumbnailUrl(imageUrl),
        category,
        isPublic,
        order: newOrder,
        uploadedBy: uploadedById
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Image uploaded successfully',
          data: galleryImage
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error uploading gallery image:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload image',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: uploadRateLimiter }
)

// Helper function to generate thumbnail URL from Cloudinary URL
function generateThumbnailUrl(url: string, size: number = 400): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  // Insert thumbnail transformation parameters
  const uploadIndex = url.indexOf('/upload/') + 8
  return url.slice(0, uploadIndex) + `c_fill,w_${size},h_${size},q_auto,f_auto/` + url.slice(uploadIndex)
}
