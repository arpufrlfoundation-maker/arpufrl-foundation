import mongoose, { Document, Schema, Model } from 'mongoose'
import { z } from 'zod'

// Zod validation schemas
export const programValidationSchema = z.object({
  name: z.string()
    .min(3, 'Program name must be at least 3 characters')
    .max(100, 'Program name must not exceed 100 characters')
    .trim(),

  slug: z.string()
    .min(3, 'Program slug must be at least 3 characters')
    .max(100, 'Program slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .trim(),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),

  longDescription: z.string()
    .min(50, 'Long description must be at least 50 characters')
    .max(5000, 'Long description must not exceed 5000 characters')
    .trim()
    .optional(),

  image: z.string()
    .url('Image must be a valid URL')
    .optional(),

  gallery: z.array(z.string().url('Gallery image must be a valid URL'))
    .max(10, 'Gallery can have maximum 10 images')
    .optional(),

  targetAmount: z.number()
    .min(1000, 'Target amount must be at least ₹1,000')
    .max(10000000, 'Target amount must not exceed ₹1,00,00,000')
    .int('Target amount must be a whole number')
    .optional(),

  active: z.boolean().default(true),

  featured: z.boolean().default(false),

  priority: z.number()
    .min(0, 'Priority must be at least 0')
    .max(100, 'Priority must not exceed 100')
    .int('Priority must be a whole number')
    .default(0),

  metaTitle: z.string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),

  metaDescription: z.string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional()
})

export const programCreationSchema = programValidationSchema.omit({
  slug: true // Slug will be auto-generated from name
})

// TypeScript interface for Program document
export interface IProgram extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  longDescription?: string
  image?: string
  gallery?: string[]

  // Funding details
  targetAmount?: number
  raisedAmount: number
  donationCount: number

  // Status and visibility
  active: boolean
  featured: boolean
  priority: number

  // SEO
  metaTitle?: string
  metaDescription?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  updateFundingStats(): Promise<IProgram>
  getFundingProgress(): number
  isFullyFunded(): boolean
  generateSlug(): string
  toSEOData(): ProgramSEOData
}

// Static methods interface
export interface IProgramModel extends Model<IProgram> {
  findBySlug(slug: string): Promise<IProgram | null>
  findActive(): Promise<IProgram[]>
  findFeatured(): Promise<IProgram[]>
  findByPriority(): Promise<IProgram[]>
  updateAllFundingStats(): Promise<void>
  searchPrograms(query: string): Promise<IProgram[]>
}

// Helper interfaces
export interface ProgramSEOData {
  title: string
  description: string
  image?: string
  url: string
  structuredData: object
}

export interface ProgramStats {
  totalPrograms: number
  activePrograms: number
  featuredPrograms: number
  totalTargetAmount: number
  totalRaisedAmount: number
  averageFundingProgress: number
  fullyFundedPrograms: number
}

// Mongoose schema definition
const programSchema = new Schema<IProgram>({
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    minlength: [3, 'Program name must be at least 3 characters'],
    maxlength: [100, 'Program name must not exceed 100 characters'],
    index: true
  },

  slug: {
    type: String,
    required: [true, 'Program slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Program slug must be at least 3 characters'],
    maxlength: [100, 'Program slug must not exceed 100 characters'],
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description must not exceed 500 characters']
  },

  longDescription: {
    type: String,
    trim: true,
    minlength: [50, 'Long description must be at least 50 characters'],
    maxlength: [5000, 'Long description must not exceed 5000 characters']
  },

  image: {
    type: String,
    trim: true,
    validate: {
      validator: function (v: string) {
        if (!v) return true
        try {
          new URL(v)
          return true
        } catch {
          return false
        }
      },
      message: 'Image must be a valid URL'
    }
  },

  gallery: [{
    type: String,
    trim: true,
    validate: {
      validator: function (v: string) {
        try {
          new URL(v)
          return true
        } catch {
          return false
        }
      },
      message: 'Gallery image must be a valid URL'
    }
  }],

  // Funding details
  targetAmount: {
    type: Number,
    min: [1000, 'Target amount must be at least ₹1,000'],
    max: [10000000, 'Target amount must not exceed ₹1,00,00,000'],
    validate: {
      validator: Number.isInteger,
      message: 'Target amount must be a whole number'
    }
  },

  raisedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Raised amount cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Raised amount must be a whole number'
    },
    index: true
  },

  donationCount: {
    type: Number,
    default: 0,
    min: [0, 'Donation count cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Donation count must be a whole number'
    }
  },

  // Status and visibility
  active: {
    type: Boolean,
    default: true,
    required: [true, 'Active status is required'],
    index: true
  },

  featured: {
    type: Boolean,
    default: false,
    index: true
  },

  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority must be at least 0'],
    max: [100, 'Priority must not exceed 100'],
    validate: {
      validator: Number.isInteger,
      message: 'Priority must be a whole number'
    },
    index: true
  },

  // SEO
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title must not exceed 60 characters']
  },

  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description must not exceed 160 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      if ('__v' in ret) delete (ret as any).__v
      return ret
    }
  }
})

// Indexes for performance - commented out for Edge Runtime compatibility
// programSchema.index({ slug: 1 }, { unique: true })
// programSchema.index({ active: 1, priority: -1 })
// programSchema.index({ featured: 1, active: 1 })
// programSchema.index({ raisedAmount: -1 })
// programSchema.index({ createdAt: -1 })
// programSchema.index({ name: 'text', description: 'text' }) // Text search index

// Pre-save middleware for slug generation
programSchema.pre('save', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.generateSlug()
  }
  next()
})

// Instance methods
programSchema.methods.updateFundingStats = async function (): Promise<IProgram> {
  const Donation = mongoose.model('Donation')

  const stats = await Donation.aggregate([
    {
      $match: {
        programId: this._id,
        paymentStatus: 'SUCCESS'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 }
      }
    }
  ])

  if (stats.length > 0) {
    this.raisedAmount = stats[0].totalAmount || 0
    this.donationCount = stats[0].totalCount || 0
  } else {
    this.raisedAmount = 0
    this.donationCount = 0
  }

  return await this.save()
}

programSchema.methods.getFundingProgress = function (): number {
  if (!this.targetAmount || this.targetAmount === 0) {
    return 0
  }

  const progress = (this.raisedAmount / this.targetAmount) * 100
  return Math.min(progress, 100) // Cap at 100%
}

programSchema.methods.isFullyFunded = function (): boolean {
  if (!this.targetAmount) {
    return false
  }

  return this.raisedAmount >= this.targetAmount
}

programSchema.methods.generateSlug = function (): string {
  return this.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

programSchema.methods.toSEOData = function (): ProgramSEOData {
  const title = this.metaTitle || `${this.name} - ARPU Future Rise Life Foundation`
  const description = this.metaDescription || this.description

  return {
    title,
    description,
    image: this.image,
    url: `/programs/${this.slug}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Project',
      name: this.name,
      description: this.description,
      image: this.image,
      url: `/programs/${this.slug}`,
      organizer: {
        '@type': 'Organization',
        name: 'ARPU Future Rise Life Foundation'
      },
      ...(this.targetAmount && {
        fundingGoal: {
          '@type': 'MonetaryAmount',
          currency: 'INR',
          value: this.targetAmount
        }
      }),
      ...(this.raisedAmount && {
        moneyRaised: {
          '@type': 'MonetaryAmount',
          currency: 'INR',
          value: this.raisedAmount
        }
      })
    }
  }
}

// Static methods
programSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase(), active: true })
}

programSchema.statics.findActive = function () {
  return this.find({ active: true }).sort({ priority: -1, createdAt: -1 })
}

programSchema.statics.findFeatured = function () {
  return this.find({ active: true, featured: true }).sort({ priority: -1, createdAt: -1 })
}

programSchema.statics.findByPriority = function () {
  return this.find({ active: true }).sort({ priority: -1, raisedAmount: -1 })
}

programSchema.statics.updateAllFundingStats = async function () {
  const programs = await this.find({})

  for (const program of programs) {
    await program.updateFundingStats()
  }
}

programSchema.statics.searchPrograms = function (query: string) {
  return this.find({
    active: true,
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' },
    priority: -1
  })
}

// Create and export the model
export const Program = (mongoose.models?.Program as IProgramModel) ||
  mongoose.model<IProgram, IProgramModel>('Program', programSchema)

// Export utility functions
export const programUtils = {
  /**
   * Validate program data using Zod schema
   */
  validateProgramData: (data: unknown) => {
    return programValidationSchema.safeParse(data)
  },

  /**
   * Validate program creation data
   */
  validateProgramCreation: (data: unknown) => {
    return programCreationSchema.safeParse(data)
  },

  /**
   * Generate unique slug from name
   */
  generateUniqueSlug: async (name: string, excludeId?: mongoose.Types.ObjectId): Promise<string> => {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let counter = 1

    while (true) {
      const query: any = { slug }
      if (excludeId) {
        query._id = { $ne: excludeId }
      }

      const existing = await Program.findOne(query)
      if (!existing) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  },

  /**
   * Get program statistics
   */
  getProgramStats: async (): Promise<ProgramStats> => {
    const stats = await Program.aggregate([
      {
        $group: {
          _id: null,
          totalPrograms: { $sum: 1 },
          activePrograms: { $sum: { $cond: ['$active', 1, 0] } },
          featuredPrograms: { $sum: { $cond: ['$featured', 1, 0] } },
          totalTargetAmount: { $sum: { $ifNull: ['$targetAmount', 0] } },
          totalRaisedAmount: { $sum: '$raisedAmount' },
          fullyFundedPrograms: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$targetAmount', 0] },
                    { $gte: ['$raisedAmount', '$targetAmount'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const result = stats[0] || {
      totalPrograms: 0,
      activePrograms: 0,
      featuredPrograms: 0,
      totalTargetAmount: 0,
      totalRaisedAmount: 0,
      fullyFundedPrograms: 0
    }

    // Calculate average funding progress
    const programsWithTargets = await Program.find({
      targetAmount: { $gt: 0 }
    })

    let totalProgress = 0
    let programsWithTargetsCount = 0

    for (const program of programsWithTargets) {
      if (program.targetAmount && program.targetAmount > 0) {
        totalProgress += (program.raisedAmount / program.targetAmount) * 100
        programsWithTargetsCount++
      }
    }

    result.averageFundingProgress = programsWithTargetsCount > 0
      ? totalProgress / programsWithTargetsCount
      : 0

    return result
  }
}