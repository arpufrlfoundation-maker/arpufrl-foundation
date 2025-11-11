/**
 * Cloudinary Upload Utility
 * Handles profile photo uploads to Cloudinary
 */

interface CloudinaryUploadResponse {
  success: boolean
  url?: string
  error?: string
}

export class CloudinaryService {
  private static UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
  private static CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
  private static API_URL = `https://api.cloudinary.com/v1_1/${CloudinaryService.CLOUD_NAME}/image/upload`

  /**
   * Check if Cloudinary is properly configured
   */
  private static isConfigured(): boolean {
    return !!(this.CLOUD_NAME && this.UPLOAD_PRESET)
  }

  /**
   * Get configuration error message
   */
  private static getConfigError(): string {
    if (!this.CLOUD_NAME && !this.UPLOAD_PRESET) {
      return 'Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file. See .env.local.example for instructions.'
    }
    if (!this.CLOUD_NAME) {
      return 'Cloudinary Cloud Name is missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your .env.local file.'
    }
    return 'Cloudinary Upload Preset is missing. Please add NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file.'
  }

  /**
   * Upload a profile photo to Cloudinary
   * @param file - File object from input
   * @returns Promise with upload result
   */
  static async uploadProfilePhoto(file: File): Promise<CloudinaryUploadResponse> {
    try {
      if (!this.isConfigured()) {
        console.error('Cloudinary Configuration Error:', this.getConfigError())
        return {
          success: false,
          error: this.getConfigError()
        }
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload JPG, PNG, or WebP images.'
        }
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 5MB.'
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.UPLOAD_PRESET)
      formData.append('folder', 'arpufrl/profiles') // Organize in folders
      // Note: transformation parameter is not allowed with unsigned uploads
      // Apply transformations on retrieval using getOptimizedUrl() instead

      console.log('Uploading to Cloudinary:', {
        cloudName: this.CLOUD_NAME,
        uploadPreset: this.UPLOAD_PRESET,
        folder: 'arpufrl/profiles',
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      })

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Cloudinary upload error response:', error)
        
        // Check for transformation error
        if (error.error && error.error.message && error.error.message.includes('Transformation parameter')) {
          throw new Error('Upload preset configuration error. Please ensure your Cloudinary upload preset does not have transformations enabled. Go to Settings > Upload > Upload presets and edit your preset to remove any transformation settings.')
        }
        
        throw new Error(error.error?.message || error.message || 'Upload failed')
      }

      const data = await response.json()

      return {
        success: true,
        url: data.secure_url
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Delete a photo from Cloudinary
   * @param publicId - Public ID of the image
   */
  static async deletePhoto(publicId: string): Promise<boolean> {
    try {
      // Note: Deletion requires server-side API key/secret
      // This should be called from an API route
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId })
      })

      return response.ok
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return false
    }
  }

  /**
   * Get optimized URL for profile photo
   * @param url - Original Cloudinary URL
   * @param size - Desired size (default: 200)
   */
  static getOptimizedUrl(url: string, size: number = 200): string {
    if (!url || !url.includes('cloudinary.com')) {
      return url
    }

    // Insert transformation parameters
    const uploadIndex = url.indexOf('/upload/') + 8
    return url.slice(0, uploadIndex) + `c_fill,w_${size},h_${size},g_face/` + url.slice(uploadIndex)
  }
}

/**
 * React Hook for file upload
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)

    const result = await CloudinaryService.uploadProfilePhoto(file)

    if (result.success && result.url) {
      setUploading(false)
      return result.url
    } else {
      setError(result.error || 'Upload failed')
      setUploading(false)
      return null
    }
  }

  return { uploadFile, uploading, error }
}

import { useState } from 'react'
