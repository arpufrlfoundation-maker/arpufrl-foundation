'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn, Download, Loader2 } from 'lucide-react'
import { GalleryCategoryType } from '@/models/Gallery'

interface GalleryImage {
  _id: string
  title: string
  description?: string
  altText: string
  imageUrl: string
  thumbnailUrl?: string
  category: GalleryCategoryType
  order: number
  createdAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

interface GalleryGridProps {
  limit?: number
}

export default function GalleryGrid({ limit = 24 }: GalleryGridProps) {
  const searchParams = useSearchParams()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const imagesPerPage = limit

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true)
      const category = searchParams.get('category') || ''
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: imagesPerPage.toString(),
      })
      
      if (category) {
        params.set('category', category)
      }

      const response = await fetch(`/api/gallery?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch gallery images')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setImages(data.data.images || [])
        setPagination(data.data.pagination || null)
      } else {
        setImages([])
        setPagination(null)
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      setImages([])
      setPagination(null)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchParams])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Listen for filter changes
  useEffect(() => {
    const handleFilterChange = () => {
      setCurrentPage(1)
      fetchImages()
    }

    window.addEventListener('galleryFilterChange', handleFilterChange)
    return () => window.removeEventListener('galleryFilterChange', handleFilterChange)
  }, [fetchImages])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      } else if (e.key === 'ArrowLeft') {
        navigateImage(-1)
      } else if (e.key === 'ArrowRight') {
        navigateImage(1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [selectedImage, images])

  const navigateImage = (direction: number) => {
    if (!selectedImage) return
    const currentIndex = images.findIndex(img => img._id === selectedImage._id)
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedImage(images[newIndex])
    }
  }

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <Camera className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Images Found</h3>
        <p className="text-gray-600">
          We&apos;re still building our gallery. Check back soon for amazing photos!
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Masonry-like Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {images.map((image, index) => (
          <div
            key={image._id}
            className={`
              group relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer
              transition-all duration-500 ease-out
              hover:shadow-2xl hover:scale-[1.02]
              ${index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''}
            `}
            onClick={() => openLightbox(image)}
            style={{ aspectRatio: index % 5 === 0 ? '1' : '1' }}
          >
            {/* Image */}
            <Image
              src={image.thumbnailUrl || image.imageUrl}
              alt={image.altText}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAQMEAQUAAAAAAAAAAAAAAQACAwQFESEGEhMxQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Azq11tvtdO5kF5qWOJJc4Fo1+dLz6iIg//9k="
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Zoom Icon */}
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg truncate">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-white/80 text-sm line-clamp-2 mt-1">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              transition-all duration-200
              ${pagination.hasPrev
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <span className="text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              transition-all duration-200
              ${pagination.hasNext
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Arrows */}
          {images.findIndex(img => img._id === selectedImage._id) > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {images.findIndex(img => img._id === selectedImage._id) < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.altText}
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
              priority
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <h2 className="text-white text-2xl font-bold mb-2">
                {selectedImage.title}
              </h2>
              {selectedImage.description && (
                <p className="text-white/80 text-base">
                  {selectedImage.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                  📁 {selectedImage.category.charAt(0).toUpperCase() + selectedImage.category.slice(1)}
                </span>
                <a
                  href={selectedImage.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  View Full Size
                </a>
              </div>
            </div>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {images.findIndex(img => img._id === selectedImage._id) + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
