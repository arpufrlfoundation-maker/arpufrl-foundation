import mongoose, { Document, Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// User role and status enums
export const UserRole = {
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINATOR',
  SUB_COORDINATOR: 'SUB_COORDINATOR',
  DONOR: 'DONOR'
} as const

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
} as const

export type UserRoleType = typeof UserRole[keyof typeof UserRole]
export type UserStatusType = typeof UserStatus[keyof typeof UserStatus]

// Zod validation schemas
export const userValidationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase()),

  phone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional(),

  role: z.enum([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR, UserRole.DONOR]),

  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING]),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),

  region: z.string()
    .min(2, 'Region must be at least 2 characters')
    .max(50, 'Region must not exceed 50 characters')
    .optional(),

  parentCoordinatorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
    .optional()
})

export const userRegistrationSchema = userValidationSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// TypeScript interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  phone?: string
  role: UserRoleType
  status: UserStatusType
  hashedPassword?: string
  emailVerified?: Date
  image?: string

  // Password reset fields
  resetPasswordToken?: string
  resetPasswordExpires?: Date

  // Email verification fields
  emailVerificationToken?: string
  emailVerificationExpires?: Date

  // Coordinator-specific fields
  region?: string
  parentCoordinatorId?: mongoose.Types.ObjectId

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>
  hashPassword(password: string): Promise<void>
  toJSON(): Partial<IUser>
}

// Static methods interface
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByRole(role: UserRoleType): Promise<IUser[]>
  findActiveUsers(): Promise<IUser[]>
  createUser(userData: Partial<IUser>, password?: string): Promise<IUser>
  validatePassword(password: string): { isValid: boolean; errors: string[] }
}

// Mongoose schema definition
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    index: true
  },

  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Invalid phone number format'],
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number must not exceed 15 digits']
  },

  role: {
    type: String,
    enum: Object.values(UserRole),
    required: [true, 'Role is required'],
    default: UserRole.DONOR,
    index: true
  },

  status: {
    type: String,
    enum: Object.values(UserStatus),
    required: [true, 'Status is required'],
    default: UserStatus.PENDING,
    index: true
  },

  hashedPassword: {
    type: String,
    select: false // Don't include in queries by default
  },

  emailVerified: {
    type: Date,
    default: null
  },

  image: {
    type: String,
    trim: true
  },

  // Password reset fields
  resetPasswordToken: {
    type: String,
    select: false
  },

  resetPasswordExpires: {
    type: Date,
    select: false
  },

  // Email verification fields
  emailVerificationToken: {
    type: String,
    select: false
  },

  emailVerificationExpires: {
    type: Date,
    select: false
  },

  // Coordinator-specific fields
  region: {
    type: String,
    trim: true,
    minlength: [2, 'Region must be at least 2 characters'],
    maxlength: [50, 'Region must not exceed 50 characters'],
    index: true
  },

  parentCoordinatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    validate: {
      validator: async function (this: IUser, value: mongoose.Types.ObjectId) {
        if (!value) return true

        // Validate that parent coordinator exists and has appropriate role
        const parentUser = await mongoose.model('User').findById(value)
        return parentUser && (parentUser.role === UserRole.ADMIN || parentUser.role === UserRole.COORDINATOR)
      },
      message: 'Parent coordinator must be an admin or coordinator'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.hashedPassword
      if ('__v' in ret) delete (ret as any).__v
      return ret
    }
  }
})

// Indexes for performance - commented out for Edge Runtime compatibility
// userSchema.index({ email: 1 }, { unique: true })
// userSchema.index({ role: 1, status: 1 })
// userSchema.index({ parentCoordinatorId: 1 })
// userSchema.index({ createdAt: -1 })

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
  // Only hash if hashedPassword is modified and contains a plain text password
  if (!this.isModified('hashedPassword') || !this.hashedPassword) {
    return next()
  }

  // Check if it's already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.hashedPassword.startsWith('$2')) {
    return next()
  }

  try {
    const saltRounds = 12
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, saltRounds)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.hashedPassword) {
    return false
  }

  try {
    return await bcrypt.compare(candidatePassword, this.hashedPassword)
  } catch (error) {
    return false
  }
}

userSchema.methods.hashPassword = async function (password: string): Promise<void> {
  const saltRounds = 12
  this.hashedPassword = await bcrypt.hash(password, saltRounds)
}

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+hashedPassword')
}

userSchema.statics.findByRole = function (role: UserRoleType) {
  return this.find({ role, status: UserStatus.ACTIVE })
}

userSchema.statics.findActiveUsers = function () {
  return this.find({ status: UserStatus.ACTIVE })
}

userSchema.statics.createUser = async function (userData: Partial<IUser>, password?: string) {
  const user = new this(userData)

  if (password) {
    await user.hashPassword(password)
  }

  return await user.save()
}

userSchema.statics.validatePassword = function (password: string) {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validation middleware
userSchema.pre('validate', function (next) {
  // Ensure coordinator-specific fields are set for coordinators
  if (this.role === UserRole.COORDINATOR || this.role === UserRole.SUB_COORDINATOR) {
    if (!this.region) {
      this.invalidate('region', 'Region is required for coordinators')
    }
  }

  // Ensure sub-coordinators have a parent coordinator
  if (this.role === UserRole.SUB_COORDINATOR && !this.parentCoordinatorId) {
    this.invalidate('parentCoordinatorId', 'Parent coordinator is required for sub-coordinators')
  }

  next()
})

// Create and export the model
export const User = (mongoose.models?.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>('User', userSchema)

// Export utility functions
export const userUtils = {
  /**
   * Validate user data using Zod schema
   */
  validateUserData: (data: unknown) => {
    return userValidationSchema.safeParse(data)
  },

  /**
   * Validate registration data
   */
  validateRegistrationData: (data: unknown) => {
    return userRegistrationSchema.safeParse(data)
  },

  /**
   * Validate login data
   */
  validateLoginData: (data: unknown) => {
    return userLoginSchema.safeParse(data)
  },

  /**
   * Check if user can manage another user
   */
  canManageUser: (manager: IUser, target: IUser): boolean => {
    // Admins can manage everyone
    if (manager.role === UserRole.ADMIN) {
      return true
    }

    // Coordinators can manage their sub-coordinators
    if (manager.role === UserRole.COORDINATOR && target.role === UserRole.SUB_COORDINATOR) {
      return target.parentCoordinatorId?.toString() === manager._id.toString()
    }

    return false
  },

  /**
   * Get user hierarchy path
   */
  getHierarchyPath: async (userId: mongoose.Types.ObjectId): Promise<IUser[]> => {
    const path: IUser[] = []
    let currentUser = await User.findById(userId).populate('parentCoordinatorId')

    while (currentUser) {
      path.unshift(currentUser)
      if (currentUser.parentCoordinatorId && typeof currentUser.parentCoordinatorId === 'object') {
        currentUser = currentUser.parentCoordinatorId as unknown as IUser
      } else {
        break
      }
    }

    return path
  }
}