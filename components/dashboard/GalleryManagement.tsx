'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  X,
  GripVertical,
  Check,
  AlertCircle,
  Camera,
  ImageIcon,
  Loader2
} from 'lucide-react'
import { CloudinaryService } from '@/lib/cloudinary'
import { GalleryCategory, GalleryCategoryType } from '@/models/Gallery'

interface GalleryImage {
  _id: string
  title: string
  description?: string
  altText: string
  imageUrl: string
  thumbnailUrl?: string
  category: GalleryCategoryType
  isPublic: boolean
  order: number
  createdAt: string
  uploadedBy?: {
    name: string
    email: string
  }
}

interface GalleryStats {
  totalImages: number
  publicImages: number
  privateImages: number
  categoryCounts: Record<string, number>
}

interface GalleryFilters {
  search: string
  category: string
  visibility: string
}

const categories = [
  { value: GalleryCategory.EVENTS, label: 'Events', icon: '🎉' },
  { value: GalleryCategory.CAMPUS, label: 'Campus', icon: '🏛️' },
  { value: GalleryCategory.PROGRAMS, label: 'Programs', icon: '📋' },
  { value: GalleryCategory.TEAM, label: 'Team', icon: '👥' },
  { value: GalleryCategory.VOLUNTEERS, label: 'Volunteers', icon: '🤝' },
  { value: GalleryCategory.COMMUNITY, label: 'Community', icon: '🌍' },
  { value: GalleryCategory.OTHER, label: 'Other', icon: '📁' },
]

export default function GalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [stats, setStats] = useState<GalleryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  
  // Upload states
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([])
  
  // Drag and drop reorder
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    category: '',
    visibility: ''
  })

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    altText: '',
    category: GalleryCategory.OTHER as GalleryCategoryType,
    isPublic: true
  })

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    altText: '',
    category: GalleryCategory.OTHER as GalleryCategoryType,
    isPublic: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 24

  useEffect(() => {
    fetchImages()
  }, [filters, currentPage])

  useEffect(() => {
    calculateStats()
  }, [images])

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        admin: 'true',
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      if (filters.category) {
        queryParams.append('category', filters.category)
      }

      const response = await fetch(`/api/gallery?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch gallery images')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        let filteredImages = data.data.images || []
        
        // Apply client-side filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredImages = filteredImages.filter((img: GalleryImage) => 
            img.title.toLowerCase().includes(searchLower) ||
            img.description?.toLowerCase().includes(searchLower) ||
            img.altText.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters.visibility === 'public') {
          filteredImages = filteredImages.filter((img: GalleryImage) => img.isPublic)
        } else if (filters.visibility === 'private') {
          filteredImages = filteredImages.filter((img: GalleryImage) => !img.isPublic)
        }
        
        setImages(filteredImages)
        setTotalPages(data.data.pagination?.totalPages || 1)
        setTotalCount(data.data.pagination?.totalCount || 0)
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
      setError('Failed to load gallery images')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const publicImages = images.filter(img => img.isPublic).length
    const categoryCounts: Record<string, number> = {}
    
    images.forEach(img => {
      categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1
    })

    setStats({
      totalImages: totalCount,
      publicImages,
      privateImages: images.length - publicImages,
      categoryCounts
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchImages()
    setRefreshing(false)
  }

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    const previews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setPreviewFiles(prev => [...prev, ...previews])
  }

  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const handleUpload = async () => {
    if (previewFiles.length === 0) return

    try {
      setUploading(true)
      setUploadProgress(0)

      const totalFiles = previewFiles.length
      let completed = 0

      for (const { file } of previewFiles) {
        // Upload to Cloudinary
        const cloudinaryResult = await CloudinaryService.uploadGalleryImage(file)
        
        if (!cloudinaryResult.success || !cloudinaryResult.url) {
          throw new Error(cloudinaryResult.error || 'Failed to upload image')
        }

        // Save to database
        const response = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...uploadForm,
            title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
            altText: uploadForm.altText || uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
            imageUrl: cloudinaryResult.url
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save image')
        }

        completed++
        setUploadProgress(Math.round((completed / totalFiles) * 100))
      }

      // Clean up and refresh
      previewFiles.forEach(p => URL.revokeObjectURL(p.preview))
      setPreviewFiles([])
      setUploadForm({
        title: '',
        description: '',
        altText: '',
        category: GalleryCategory.OTHER,
        isPublic: true
      })
      setShowUploadModal(false)
      await fetchImages()

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Edit functionality
  const openEditModal = (image: GalleryImage) => {
    setSelectedImage(image)
    setEditForm({
      title: image.title,
      description: image.description || '',
      altText: image.altText,
      category: image.category,
      isPublic: image.isPublic
    })
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedImage) return

    try {
      setUploading(true)

      const response = await fetch(`/api/gallery/${selectedImage._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update image')
      }

      setShowEditModal(false)
      setSelectedImage(null)
      await fetchImages()

    } catch (error) {
      console.error('Edit error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update image')
    } finally {
      setUploading(false)
    }
  }

  // Delete functionality
  const openDeleteModal = (image: GalleryImage) => {
    setSelectedImage(image)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedImage) return

    try {
      setUploading(true)

      const response = await fetch(`/api/gallery/${selectedImage._id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete image')
      }

      setShowDeleteModal(false)
      setSelectedImage(null)
      await fetchImages()

    } catch (error) {
      console.error('Delete error:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete image')
    } finally {
      setUploading(false)
    }
  }

  // Toggle visibility
  const toggleVisibility = async (image: GalleryImage) => {
    try {
      const response = await fetch(`/api/gallery/${image._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !image.isPublic })
      })

      if (!response.ok) {
        throw new Error('Failed to update visibility')
      }

      await fetchImages()
    } catch (error) {
      console.error('Toggle visibility error:', error)
      setError('Failed to update image visibility')
    }
  }

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedItem = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedItem)
    
    setImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    setIsDragging(false)
    setDraggedIndex(null)

    // Save new order
    try {
      setIsReordering(true)
      
      const imageOrders = images.map((img, index) => ({
        id: img._id,
        order: index
      }))

      const response = await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageOrders })
      })

      if (!response.ok) {
        throw new Error('Failed to save order')
      }
    } catch (error) {
      console.error('Reorder error:', error)
      setError('Failed to save image order')
      await fetchImages() // Revert on error
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600 mt-1">Upload, organize, and manage gallery images</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Images
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalImages}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Public</p>
                <p className="text-xl font-bold text-gray-900">{stats.publicImages}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Private</p>
                <p className="text-xl font-bold text-gray-900">{stats.privateImages}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-xl font-bold text-gray-900">{Object.keys(stats.categoryCounts).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Reordering indicator */}
      {isReordering && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-blue-700">Saving new order...</p>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Found</h3>
          <p className="text-gray-600 mb-4">Start building your gallery by uploading some images.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div
              key={image._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-move
                border-2 transition-all duration-200
                ${isDragging && draggedIndex === index ? 'opacity-50 border-purple-500' : 'border-transparent hover:border-purple-300'}
              `}
            >
              {/* Image */}
              <Image
                src={image.thumbnailUrl || image.imageUrl}
                alt={image.altText}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
              />

              {/* Drag Handle */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-md">
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              {/* Visibility Badge */}
              <div className="absolute top-2 right-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${image.isPublic ? 'bg-green-500' : 'bg-orange-500'}`}>
                  {image.isPublic ? (
                    <Eye className="w-4 h-4 text-white" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleVisibility(image)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  title={image.isPublic ? 'Make Private' : 'Make Public'}
                >
                  {image.isPublic ? (
                    <EyeOff className="w-5 h-5 text-white" />
                  ) : (
                    <Eye className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => openEditModal(image)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => openDeleteModal(image)}
                  className="w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm font-medium truncate">{image.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Upload Images</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    previewFiles.forEach(p => URL.revokeObjectURL(p.preview))
                    setPreviewFiles([])
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to select images or drag and drop</p>
                <p className="text-sm text-gray-500">JPG, PNG, WebP • Max 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Preview Grid */}
              {previewFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {previewFiles.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => removePreviewFile(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional for batch upload)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Leave empty to use filename"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a description..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text (for accessibility)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.altText}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="Describe the image for screen readers"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as GalleryCategoryType }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      value={uploadForm.isPublic ? 'public' : 'private'}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.value === 'public' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  previewFiles.forEach(p => URL.revokeObjectURL(p.preview))
                  setPreviewFiles([])
                }}
                disabled={uploading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || previewFiles.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {previewFiles.length} Image{previewFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Image</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={selectedImage.thumbnailUrl || selectedImage.imageUrl}
                  alt={selectedImage.altText}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={editForm.altText}
                  onChange={(e) => setEditForm(prev => ({ ...prev, altText: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as GalleryCategoryType }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    value={editForm.isPublic ? 'public' : 'private'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.value === 'public' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={uploading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Image</h2>
              <p className="text-gray-600 text-center">
                Are you sure you want to delete &quot;{selectedImage.title}&quot;? This action cannot be undone.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={uploading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
