import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { GalleryImage } from '@/models/Gallery'
import { Blog } from '@/models/Blog'
import { UserRole } from '@/models/User'

/**
 * DELETE /api/admin/clear-data
 * Admin only endpoint to clear gallery and blog data from database
 * 
 * Query parameters:
 * - type: 'gallery' | 'blog' | 'all' (default: 'all')
 */
export async function DELETE(request: NextRequest) {
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

    const searchParams = new URL(request.url).searchParams
    const clearType = searchParams.get('type') || 'all'

    let deletedGalleryCount = 0
    let deletedBlogCount = 0

    if (clearType === 'gallery' || clearType === 'all') {
      const galleryResult = await GalleryImage.deleteMany({})
      deletedGalleryCount = galleryResult.deletedCount
    }

    if (clearType === 'blog' || clearType === 'all') {
      const blogResult = await Blog.deleteMany({})
      deletedBlogCount = blogResult.deletedCount
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Data cleared successfully',
        data: {
          deletedGalleryImages: deletedGalleryCount,
          deletedBlogs: deletedBlogCount,
          totalDeleted: deletedGalleryCount + deletedBlogCount
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error clearing data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
