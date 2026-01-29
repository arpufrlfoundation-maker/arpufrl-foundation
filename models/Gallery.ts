import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'

// Gallery Categories
export const GalleryCategory = {
  EVENTS: 'events',
  CAMPUS: 'campus',
  PROGRAMS: 'programs',
  TEAM: 'team',
  VOLUNTEERS: 'volunteers',
  COMMUNITY: 'community',
  OTHER: 'other'
} as const

export type GalleryCategoryType = typeof GalleryCategory[keyof typeof GalleryCategory]

// Zod validation schemas
export const galleryImageValidationSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .trim(),

  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),

  altText: z.string()
    .min(3, 'Alt text must be at least 3 characters')
    .max(200, 'Alt text must not exceed 200 characters')
    .trim(),

  category: z.enum([
    GalleryCategory.EVENTS,
    GalleryCategory.CAMPUS,
    GalleryCategory.PROGRAMS,
    GalleryCategory.TEAM,
    GalleryCategory.VOLUNTEERS,
    GalleryCategory.COMMUNITY,
    GalleryCategory.OTHER
  ]).default(GalleryCategory.OTHER),

  isPublic: z.boolean().default(true),

  order: z.number().int().min(0).default(0)
})

export const galleryImageUpdateSchema = galleryImageValidationSchema.partial()

export const galleryUploadSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .trim(),

  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),

  altText: z.string()
    .min(3, 'Alt text must be at least 3 characters')
    .max(200, 'Alt text must not exceed 200 characters')
    .trim(),

  category: z.enum([
    GalleryCategory.EVENTS,
    GalleryCategory.CAMPUS,
    GalleryCategory.PROGRAMS,
    GalleryCategory.TEAM,
    GalleryCategory.VOLUNTEERS,
    GalleryCategory.COMMUNITY,
    GalleryCategory.OTHER
  ]).default(GalleryCategory.OTHER),

  isPublic: z.boolean().default(true),

  imageUrl: z.string().url('Invalid image URL')
})

// TypeScript interface for Gallery Image
export interface IGalleryImage extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  altText: string
  imageUrl: string
  thumbnailUrl?: string
  category: GalleryCategoryType
  isPublic: boolean
  order: number
  width?: number
  height?: number
  fileSize?: number
  uploadedBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

// Mongoose Schema
const galleryImageSchema = new Schema<IGalleryImage>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters']
    },
    altText: {
      type: String,
      required: [true, 'Alt text is required for accessibility'],
      trim: true,
      minlength: [3, 'Alt text must be at least 3 characters'],
      maxlength: [200, 'Alt text must not exceed 200 characters']
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required']
    },
    thumbnailUrl: {
      type: String
    },
    category: {
      type: String,
      enum: Object.values(GalleryCategory),
      default: GalleryCategory.OTHER
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    fileSize: {
      type: Number
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient queries
galleryImageSchema.index({ category: 1, isPublic: 1 })
galleryImageSchema.index({ order: 1 })
galleryImageSchema.index({ createdAt: -1 })
galleryImageSchema.index({ isPublic: 1, order: 1 })

// Static method to get public images
galleryImageSchema.statics.getPublicImages = async function(
  category?: GalleryCategoryType,
  limit?: number
) {
  const query: Record<string, unknown> = { isPublic: true }
  if (category) {
    query.category = category
  }
  
  let findQuery = this.find(query).sort({ order: 1, createdAt: -1 })
  
  if (limit) {
    findQuery = findQuery.limit(limit)
  }
  
  return findQuery.exec()
}

// Static method to reorder images
galleryImageSchema.statics.reorderImages = async function(
  imageOrders: { id: string; order: number }[]
) {
  const bulkOps = imageOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id) },
      update: { $set: { order } }
    }
  }))
  
  return this.bulkWrite(bulkOps)
}

// Interface for the model with static methods
interface IGalleryImageModel extends Model<IGalleryImage> {
  getPublicImages(category?: GalleryCategoryType, limit?: number): Promise<IGalleryImage[]>
  reorderImages(imageOrders: { id: string; order: number }[]): Promise<mongoose.mongo.BulkWriteResult>
}

// Create and export the model
export const GalleryImage = (
  (mongoose.models?.GalleryImage as unknown as IGalleryImageModel) || 
  mongoose.model<IGalleryImage, IGalleryImageModel>('GalleryImage', galleryImageSchema)
) as IGalleryImageModel
