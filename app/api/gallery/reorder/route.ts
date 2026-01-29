import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { GalleryImage } from '@/models/Gallery'
import { auth } from '@/lib/auth'
import { UserRole } from '@/models/User'
import { withApiHandler } from '@/lib/api-handler'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// Rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20
})

// Validation schema for reorder request
const reorderSchema = z.object({
  imageOrders: z.array(
    z.object({
      id: z.string().min(1, 'Image ID is required'),
      order: z.number().int().min(0, 'Order must be a positive integer')
    })
  ).min(1, 'At least one image order is required')
})

// POST /api/gallery/reorder - Reorder gallery images (admin only)
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

      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      await connectToDatabase()

      const body = await request.json()

      // Validate input
      const validationResult = reorderSchema.safeParse(body)
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

      const { imageOrders } = validationResult.data

      // Use the static method to reorder images
      await GalleryImage.reorderImages(imageOrders)

      return NextResponse.json({
        success: true,
        message: 'Gallery images reordered successfully'
      })
    } catch (error) {
      console.error('Error reordering gallery images:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to reorder images',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)
