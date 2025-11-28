import mongoose, { Document, Schema, Model } from 'mongoose'

export enum CertificateType {
  APPRECIATION = 'APPRECIATION',
  MEMBERSHIP = 'MEMBERSHIP',
  CONTRIBUTION = 'CONTRIBUTION',
  VOLUNTEER = 'VOLUNTEER',
  EVENT = 'EVENT',
  CONTEST = 'CONTEST'
}

export enum CertificateStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  SENT = 'SENT'
}

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId
  certificateNumber: string
  certificateType: CertificateType

  // Recipient Details
  recipientName: string
  recipientEmail?: string
  recipientDesignation?: string
  userId?: mongoose.Types.ObjectId

  // Certificate Content
  eventName?: string
  activityDescription?: string
  dateOfEvent?: Date
  placeOfEvent?: string

  // Membership specific
  membershipId?: string
  membershipStartDate?: Date
  membershipType?: string

  // Issue Details
  issueDate: Date
  issuedBy?: string
  signature?: string

  // Status
  status: CertificateStatus
  generatedAt?: Date
  emailSent: boolean
  emailSentAt?: Date

  // PDF Storage
  pdfUrl?: string

  createdAt: Date
  updatedAt: Date
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    certificateType: {
      type: String,
      enum: Object.values(CertificateType),
      required: true
    },

    // Recipient Details
    recipientName: {
      type: String,
      required: true
    },
    recipientEmail: {
      type: String
    },
    recipientDesignation: {
      type: String
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    // Certificate Content
    eventName: {
      type: String
    },
    activityDescription: {
      type: String
    },
    dateOfEvent: {
      type: Date
    },
    placeOfEvent: {
      type: String
    },

    // Membership specific
    membershipId: {
      type: String
    },
    membershipStartDate: {
      type: Date
    },
    membershipType: {
      type: String
    },

    // Issue Details
    issueDate: {
      type: Date,
      default: Date.now
    },
    issuedBy: {
      type: String
    },
    signature: {
      type: String
    },

    // Status
    status: {
      type: String,
      enum: Object.values(CertificateStatus),
      default: CertificateStatus.PENDING
    },
    generatedAt: {
      type: Date
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date
    },

    // PDF Storage
    pdfUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

// Indexes
certificateSchema.index({ certificateNumber: 1 }, { unique: true })
certificateSchema.index({ userId: 1 })
certificateSchema.index({ certificateType: 1 })
certificateSchema.index({ status: 1 })
certificateSchema.index({ issueDate: -1 })

// Generate unique certificate number
certificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const date = new Date()
    const year = date.getFullYear()
    const typePrefix = this.certificateType.substring(0, 3).toUpperCase()
    const count = await mongoose.model<ICertificate>('Certificate').countDocuments()
    this.certificateNumber = `ARPU/${typePrefix}/${year}/${String(count + 1).padStart(5, '0')}`
  }
  next()
})

export const Certificate: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', certificateSchema)
export default Certificate
