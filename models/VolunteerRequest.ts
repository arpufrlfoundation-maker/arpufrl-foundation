import mongoose, { Document, Model, Schema } from 'mongoose'

// Volunteer Request Status enum
export enum VolunteerRequestStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

// Volunteer Interest Areas
export enum VolunteerInterest {
  TEACHING = 'TEACHING',
  HEALTHCARE = 'HEALTHCARE',
  FUNDRAISING = 'FUNDRAISING',
  SOCIAL_WORK = 'SOCIAL_WORK',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  TECHNICAL = 'TECHNICAL',
  OTHER = 'OTHER'
}

export interface IVolunteerRequest extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  phone: string
  state?: string
  city?: string
  interests: VolunteerInterest[]
  message: string
  availability: string
  experience?: string
  status: VolunteerRequestStatus
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: mongoose.Types.ObjectId
  notes?: string

  // Certificate fields
  certificateIssued: boolean
  certificateId?: mongoose.Types.ObjectId
  certificateIssuedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const volunteerRequestSchema = new Schema<IVolunteerRequest>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    state: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    interests: {
      type: [String],
      enum: Object.values(VolunteerInterest),
      required: [true, 'At least one area of interest is required'],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0
        },
        message: 'Please select at least one area of interest'
      }
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    availability: {
      type: String,
      required: [true, 'Availability information is required'],
      trim: true
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [500, 'Experience description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: Object.values(VolunteerRequestStatus),
      default: VolunteerRequestStatus.PENDING
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate'
    },
    certificateIssuedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
volunteerRequestSchema.index({ email: 1 })
volunteerRequestSchema.index({ status: 1, submittedAt: -1 })
volunteerRequestSchema.index({ state: 1 })

// Static methods
volunteerRequestSchema.statics = {
  /**
   * Get pending requests count
   */
  async getPendingCount(): Promise<number> {
    return this.countDocuments({ status: VolunteerRequestStatus.PENDING })
  },

  /**
   * Get recent requests
   */
  async getRecentRequests(limit: number = 10) {
    return this.find()
      .sort({ submittedAt: -1 })
      .limit(limit)
      .populate('reviewedBy', 'name email')
      .lean()
  },

  /**
   * Get requests by status
   */
  async getByStatus(status: VolunteerRequestStatus, limit?: number) {
    const query = this.find({ status }).sort({ submittedAt: -1 })
    if (limit) query.limit(limit)
    return query.lean()
  }
}

// Export model
const VolunteerRequest: Model<IVolunteerRequest> =
  mongoose.models.VolunteerRequest ||
  mongoose.model<IVolunteerRequest>('VolunteerRequest', volunteerRequestSchema)

export default VolunteerRequest
