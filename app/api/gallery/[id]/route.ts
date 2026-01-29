import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { GalleryImage, galleryImageUpdateSchema } from '@/models/Gallery'
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

// GET /api/gallery/[id] - Get single image details
export const GET = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid image ID' },
          { status: 400 }
        )
      }

      await connectToDatabase()

      const image = await GalleryImage.findById(id)
        .populate('uploadedBy', 'name email')

      if (!image) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        )
      }

      // Check if image is public or user is admin
      if (!image.isPublic) {
        const session = await auth()
        if (!session?.user || session.user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Image not found' },
            { status: 404 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        data: image
      })
    } catch (error) {
      console.error('Error fetching gallery image:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch image',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)

// PUT /api/gallery/[id] - Update image metadata (admin only)
export const PUT = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

      const { id } = await params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid image ID' },
          { status: 400 }
        )
      }

      await connectToDatabase()

      const body = await request.json()

      // Validate input
      const validationResult = galleryImageUpdateSchema.safeParse(body)
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

      const image = await GalleryImage.findByIdAndUpdate(
        id,
        { $set: validationResult.data },
        { new: true, runValidators: true }
      ).populate('uploadedBy', 'name email')

      if (!image) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Image updated successfully',
        data: image
      })
    } catch (error) {
      console.error('Error updating gallery image:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update image',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)

// DELETE /api/gallery/[id] - Delete image (admin only)
export const DELETE = withApiHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

      const { id } = await params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid image ID' },
          { status: 400 }
        )
      }

      await connectToDatabase()

      const image = await GalleryImage.findByIdAndDelete(id)

      if (!image) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        )
      }

      // Note: Cloudinary image deletion should be handled separately
      // Consider implementing a cleanup job or calling Cloudinary API here

      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting gallery image:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete image',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  },
  { rateLimit: apiRateLimiter }
)
