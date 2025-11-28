import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId
  receiptNumber: string
  donationId: mongoose.Types.ObjectId

  // Organization Details
  cinNumber: string
  uniqueRegistrationNo: string
  uniqueDocumentationNo: string
  panNumber: string

  // Donor Details
  donorName: string
  donorEmail?: string
  donorPhone?: string
  donorPAN?: string

  // Donation Details
  amount: number
  currency: string
  donationType?: string
  programName?: string

  // Timestamps
  donationDate: Date
  receiptGeneratedAt: Date

  // Status
  emailSent: boolean
  emailSentAt?: Date

  // PDF Storage
  pdfUrl?: string

  createdAt: Date
  updatedAt: Date
}

const receiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true
    },

    // Organization Details (Fixed values)
    cinNumber: {
      type: String,
      default: 'U88900DL2025NPL451013'
    },
    uniqueRegistrationNo: {
      type: String,
      default: 'ABDCA2272KF20251'
    },
    uniqueDocumentationNo: {
      type: String,
      default: 'ABDCA2272KF2025101'
    },
    panNumber: {
      type: String,
      default: 'ABDCA2272K'
    },

    // Donor Details
    donorName: {
      type: String,
      required: true
    },
    donorEmail: {
      type: String
    },
    donorPhone: {
      type: String
    },
    donorPAN: {
      type: String,
      uppercase: true
    },

    // Donation Details
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    donationType: {
      type: String
    },
    programName: {
      type: String
    },

    // Timestamps
    donationDate: {
      type: Date,
      required: true
    },
    receiptGeneratedAt: {
      type: Date,
      default: Date.now
    },

    // Email Status
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
receiptSchema.index({ donationId: 1 })
receiptSchema.index({ receiptNumber: 1 }, { unique: true })
receiptSchema.index({ donorEmail: 1 })
receiptSchema.index({ donationDate: -1 })

// Generate unique receipt number
receiptSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const count = await mongoose.model<IReceipt>('Receipt').countDocuments()
    this.receiptNumber = `ARPU/${year}/${month}/${String(count + 1).padStart(6, '0')}`
  }
  next()
})

export const Receipt: Model<IReceipt> = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', receiptSchema)
export default Receipt
