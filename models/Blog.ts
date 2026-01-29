import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'

// Zod validation schemas
export const blogValidationSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title must not exceed 500 characters')
    .trim(),

  slug: z.string()
    .min(5, 'Slug must be at least 5 characters')
    .max(200, 'Slug must not exceed 200 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .trim(),

  excerpt: z.string()
    .min(10, 'Excerpt must be at least 10 characters')
    .max(1000, 'Excerpt must not exceed 1000 characters')
    .trim(),

  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(100000, 'Content must not exceed 100000 characters'),

  featuredImage: z.string()
    .url('Featured image must be a valid URL'),

  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),

  tags: z.array(
    z.string()
      .min(2, 'Tag must be at least 2 characters')
      .max(30, 'Tag must not exceed 30 characters')
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  published: z.boolean().default(true),

  metaTitle: z.string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),

  metaDescription: z.string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional()
})

export const blogUpdateSchema = blogValidationSchema.partial()

// TypeScript interface for Blog
export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  category: string
  tags: string[]
  published: boolean
  author?: mongoose.Types.ObjectId | null
  views: number
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
}

// Mongoose Schema
const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [500, 'Title must not exceed 500 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [5, 'Slug must be at least 5 characters'],
      maxlength: [200, 'Slug must not exceed 200 characters'],
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      minlength: [10, 'Excerpt must be at least 10 characters'],
      maxlength: [1000, 'Excerpt must not exceed 1000 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [10, 'Content must be at least 10 characters'],
      maxlength: [100000, 'Content must not exceed 100000 characters']
    },
    featuredImage: {
      type: String,
      required: [true, 'Featured image is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [50, 'Category must not exceed 50 characters']
    },
    tags: {
      type: [String],
      default: []
    },
    published: {
      type: Boolean,
      default: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    views: {
      type: Number,
      default: 0
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title must not exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description must not exceed 160 characters']
    }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient queries (slug index is automatic from unique: true)
blogSchema.index({ category: 1 })
blogSchema.index({ published: 1 })
blogSchema.index({ tags: 1 })
blogSchema.index({ createdAt: -1 })
blogSchema.index({ published: 1, createdAt: -1 })

// Static method to get published blogs
blogSchema.statics.getPublishedBlogs = async function(
  category?: string,
  limit?: number,
  skip?: number
) {
  const query: Record<string, unknown> = { published: true }
  if (category) {
    query.category = category
  }
  
  let findQuery = this.find(query).sort({ createdAt: -1 })
  
  if (skip) {
    findQuery = findQuery.skip(skip)
  }
  
  if (limit) {
    findQuery = findQuery.limit(limit)
  }
  
  return findQuery.populate('author', 'name email profilePhoto').exec()
}

// Static method to increment views
blogSchema.statics.incrementView = async function(blogId: string) {
  return this.findByIdAndUpdate(
    blogId,
    { $inc: { views: 1 } },
    { new: true }
  )
}

// Interface for the model with static methods
interface IBlogModel extends Model<IBlog> {
  getPublishedBlogs(category?: string, limit?: number, skip?: number): Promise<IBlog[]>
  incrementView(blogId: string): Promise<IBlog | null>
}

// Create and export the model
export const Blog: IBlogModel = 
  (mongoose.models.Blog as IBlogModel) || 
  mongoose.model<IBlog, IBlogModel>('Blog', blogSchema)
