import mongoose, { Document, Schema, Model } from 'mongoose'

// Survey types enum
export const SurveyType = {
  HOSPITAL: 'HOSPITAL',
  SCHOOL: 'SCHOOL',
  HEALTH_CAMP: 'HEALTH_CAMP',
  COMMUNITY_WELFARE: 'COMMUNITY_WELFARE',
  STAFF_VOLUNTEER: 'STAFF_VOLUNTEER',
  BUSINESS: 'BUSINESS',
  CITIZEN: 'CITIZEN',
  POLITICAL_ANALYSIS: 'POLITICAL_ANALYSIS'
} as const

export const SurveyStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  ARCHIVED: 'ARCHIVED'
} as const

export type SurveyTypeValue = typeof SurveyType[keyof typeof SurveyType]
export type SurveyStatusValue = typeof SurveyStatus[keyof typeof SurveyStatus]

// TypeScript interface for Survey document
export interface ISurvey extends Document {
  _id: mongoose.Types.ObjectId
  surveyType: SurveyTypeValue
  status: SurveyStatusValue

  // Common fields
  location: string
  district: string
  state: string
  surveyorName: string
  surveyorContact: string
  surveyDate: Date

  // Type-specific data stored as JSON
  data: any

  // Metadata
  submittedBy?: mongoose.Types.ObjectId
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  notes?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Static methods interface
export interface ISurveyModel extends Model<ISurvey> {
  findByType(surveyType: SurveyTypeValue): Promise<ISurvey[]>
  findByStatus(status: SurveyStatusValue): Promise<ISurvey[]>
  findByLocation(location: string): Promise<ISurvey[]>
}

// Mongoose schema definition
const surveySchema = new Schema<ISurvey>({
  surveyType: {
    type: String,
    enum: Object.values(SurveyType),
    required: [true, 'Survey type is required'],
    index: true
  },

  status: {
    type: String,
    enum: Object.values(SurveyStatus),
    required: [true, 'Status is required'],
    default: SurveyStatus.SUBMITTED,
    index: true
  },

  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location must not exceed 200 characters']
  },

  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [100, 'District must not exceed 100 characters'],
    index: true
  },

  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State must not exceed 100 characters'],
    index: true
  },

  surveyorName: {
    type: String,
    required: [true, 'Surveyor name is required'],
    trim: true,
    maxlength: [100, 'Surveyor name must not exceed 100 characters']
  },

  surveyorContact: {
    type: String,
    required: [true, 'Surveyor contact is required'],
    trim: true,
    maxlength: [20, 'Contact must not exceed 20 characters']
  },

  surveyDate: {
    type: Date,
    required: [true, 'Survey date is required'],
    index: true
  },

  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Survey data is required']
  },

  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedAt: {
    type: Date
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must not exceed 1000 characters']
  }
}, {
  timestamps: true
})

// Static methods
surveySchema.statics.findByType = function (surveyType: SurveyTypeValue) {
  return this.find({ surveyType }).sort({ createdAt: -1 })
}

surveySchema.statics.findByStatus = function (status: SurveyStatusValue) {
  return this.find({ status }).sort({ createdAt: -1 })
}

surveySchema.statics.findByLocation = function (location: string) {
  return this.find({ location: { $regex: location, $options: 'i' } }).sort({ createdAt: -1 })
}

// Create and export the model
export const Survey = (mongoose.models?.Survey as ISurveyModel) ||
  mongoose.model<ISurvey, ISurveyModel>('Survey', surveySchema)
