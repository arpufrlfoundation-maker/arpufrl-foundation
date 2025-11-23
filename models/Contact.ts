import mongoose, { Document, Schema, Model } from 'mongoose'

export const ContactStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const

export const InquiryType = {
  GENERAL: 'general',
  VOLUNTEER: 'volunteer',
  PARTNERSHIP: 'partnership',
  DONATION: 'donation',
  MEDIA: 'media',
  OTHER: 'other'
} as const

export type ContactStatusType = typeof ContactStatus[keyof typeof ContactStatus]
export type InquiryTypeType = typeof InquiryType[keyof typeof InquiryType]

export interface IContact extends Document {
  name: string
  email: string
  phone?: string
  subject: string
  inquiryType: InquiryTypeType
  message: string
  status: ContactStatusType
  adminNotes?: string
  resolvedAt?: Date
  resolvedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [3, 'Subject must be at least 3 characters'],
      maxlength: [200, 'Subject must not exceed 200 characters']
    },
    inquiryType: {
      type: String,
      required: [true, 'Inquiry type is required'],
      enum: Object.values(InquiryType),
      default: InquiryType.GENERAL
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message must not exceed 2000 characters']
    },
    status: {
      type: String,
      enum: Object.values(ContactStatus),
      default: ContactStatus.NEW
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes must not exceed 1000 characters']
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient queries
ContactSchema.index({ email: 1 })
ContactSchema.index({ status: 1 })
ContactSchema.index({ inquiryType: 1 })
ContactSchema.index({ createdAt: -1 })

// Prevent model recompilation in development
const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema)

export default Contact
