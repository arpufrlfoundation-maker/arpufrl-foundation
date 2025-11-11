import mongoose, { Document, Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// User role and status enums with 11-level hierarchy (National to Village)
export const UserRole = {
  ADMIN: 'ADMIN', // Super admin for system management
  CENTRAL_PRESIDENT: 'CENTRAL_PRESIDENT', // National President - Level 1
  STATE_PRESIDENT: 'STATE_PRESIDENT', // State President - Level 2
  STATE_COORDINATOR: 'STATE_COORDINATOR', // State Coordinator - Level 3
  ZONE_COORDINATOR: 'ZONE_COORDINATOR', // Zone/Mandal Coordinator - Level 4
  DISTRICT_PRESIDENT: 'DISTRICT_PRESIDENT', // District President (DP) - Level 5
  DISTRICT_COORDINATOR: 'DISTRICT_COORDINATOR', // District Coordinator (DC) - Level 6
  BLOCK_COORDINATOR: 'BLOCK_COORDINATOR', // Block Coordinator (BC) - Level 7
  NODAL_OFFICER: 'NODAL_OFFICER', // Nyay Panchayat Officer - Level 8
  PRERAK: 'PRERAK', // Gram Sabha Coordinator - Level 9
  PRERNA_SAKHI: 'PRERNA_SAKHI', // Revenue Village Representative - Level 10
  VOLUNTEER: 'VOLUNTEER' // Member/Supporter - Level 11
} as const

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
} as const

// Hierarchy mapping - defines the hierarchical level of each role
export const RoleHierarchy: Record<UserRoleType, number> = {
  ADMIN: 0, // System administrator
  CENTRAL_PRESIDENT: 1, // National President
  STATE_PRESIDENT: 2, // State President
  STATE_COORDINATOR: 3, // State Coordinator
  ZONE_COORDINATOR: 4, // Zone Coordinator
  DISTRICT_PRESIDENT: 5, // District President
  DISTRICT_COORDINATOR: 6, // District Coordinator
  BLOCK_COORDINATOR: 7, // Block Coordinator
  NODAL_OFFICER: 8, // Nodal Officer
  PRERAK: 9, // Prerak
  PRERNA_SAKHI: 10, // Prerna Sakhi
  VOLUNTEER: 11 // Volunteer
}

// Role display names for UI
export const RoleDisplayNames: Record<UserRoleType, string> = {
  ADMIN: 'System Administrator',
  CENTRAL_PRESIDENT: 'Central President',
  STATE_PRESIDENT: 'State President',
  STATE_COORDINATOR: 'State Coordinator',
  ZONE_COORDINATOR: 'Zone Coordinator',
  DISTRICT_PRESIDENT: 'District President (DP)',
  DISTRICT_COORDINATOR: 'District Coordinator (DC)',
  BLOCK_COORDINATOR: 'Block Coordinator (BC)',
  NODAL_OFFICER: 'Nodal Officer',
  PRERAK: 'Prerak',
  PRERNA_SAKHI: 'Prerna Sakhi',
  VOLUNTEER: 'Volunteer'
}

export type UserRoleType = typeof UserRole[keyof typeof UserRole]
export type UserStatusType = typeof UserStatus[keyof typeof UserStatus]

// Zod validation schemas
export const userValidationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  fatherName: z.string()
    .min(2, 'Father name must be at least 2 characters')
    .max(100, 'Father name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Father name can only contain letters and spaces')
    .optional(),

  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters')
    .optional(),

  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase()),

  phone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional(),

  fatherPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional(),

  motherPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional(),

  profilePhoto: z.string().url('Invalid URL format').optional(),

  uniqueId: z.string().optional(),

  role: z.enum([
    UserRole.ADMIN,
    UserRole.CENTRAL_PRESIDENT,
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI,
    UserRole.VOLUNTEER
  ]),

  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING, UserStatus.SUSPENDED]).optional().default(UserStatus.PENDING),

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
    .optional(),

  // Referral code for tracking donations
  referralCode: z.string()
    .min(3, 'Referral code must be at least 3 characters')
    .max(50, 'Referral code must not exceed 50 characters')
    .optional(),

  // Location hierarchy - enhanced for complete geographical tracking
  state: z.string().min(2).max(50).optional(),
  zone: z.string().max(50).optional(), // Zone/Mandal
  district: z.string().min(2).max(50).optional(), // Jila/District
  block: z.string().max(50).optional(),
  panchayat: z.string().max(50).optional(), // Nyay Panchayat
  gramSabha: z.string().max(50).optional(), // Gram Sabha
  revenueVillage: z.string().max(50).optional() // Revenue Village
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
  fatherName?: string // Father's Name
  address?: string // Full Address
  email: string
  phone?: string
  fatherPhone?: string
  motherPhone?: string
  role: UserRoleType
  status: UserStatusType
  hashedPassword?: string
  emailVerified?: Date
  image?: string // Profile photo URL
  profilePhoto?: string // Cloudinary profile photo URL
  uniqueId?: string // Auto-generated unique identifier

  // Password reset fields
  resetPasswordToken?: string
  resetPasswordExpires?: Date

  // Email verification fields
  emailVerificationToken?: string
  emailVerificationExpires?: Date

  // Coordinator-specific fields
  region?: string
  parentCoordinatorId?: mongoose.Types.ObjectId

  // Referral tracking
  referralCode?: string

  // Location hierarchy - enhanced for complete geographical tracking
  state?: string
  zone?: string // Zone/Mandal
  district?: string // Jila/District
  block?: string
  panchayat?: string // Nyay Panchayat
  gramSabha?: string // Gram Sabha
  revenueVillage?: string // Revenue Village

  // Performance tracking
  totalDonationsReferred?: number
  totalAmountReferred?: number

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>
  hashPassword(password: string): Promise<void>
  toJSON(): Partial<IUser>
  getHierarchyPath(): Promise<IUser[]>
  getSubordinates(): Promise<IUser[]>
  canManageUser(targetUserId: mongoose.Types.ObjectId): Promise<boolean>
}

// Static methods interface
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByRole(role: UserRoleType): Promise<IUser[]>
  findActiveUsers(): Promise<IUser[]>
  createUser(userData: Partial<IUser>, password?: string): Promise<IUser>
  validatePassword(password: string): { isValid: boolean; errors: string[] }
  findByReferralCode(code: string): Promise<IUser | null>
  getHierarchyTree(userId: mongoose.Types.ObjectId): Promise<any>
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

  fatherName: {
    type: String,
    trim: true,
    minlength: [2, 'Father name must be at least 2 characters'],
    maxlength: [100, 'Father name must not exceed 100 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Father name can only contain letters and spaces']
  },

  address: {
    type: String,
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [200, 'Address must not exceed 200 characters']
  },

  uniqueId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    index: true
  },

  profilePhoto: {
    type: String,
    trim: true
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

  // Emergency contact phone numbers
  fatherPhone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Invalid phone number format'],
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number must not exceed 15 digits']
  },

  motherPhone: {
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
    default: UserRole.VOLUNTEER,
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
        if (!parentUser) return false

        // Check if parent is higher in hierarchy
        const parentLevel = RoleHierarchy[parentUser.role as UserRoleType]
        const currentLevel = RoleHierarchy[this.role]
        return parentLevel < currentLevel
      },
      message: 'Parent must be higher in hierarchy'
    }
  },

  // Referral tracking
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },

  // Location hierarchy
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State must not exceed 50 characters']
  },

  zone: {
    type: String,
    trim: true,
    maxlength: [50, 'Zone must not exceed 50 characters']
  },

  district: {
    type: String,
    trim: true,
    maxlength: [50, 'District must not exceed 50 characters']
  },

  block: {
    type: String,
    trim: true,
    maxlength: [50, 'Block must not exceed 50 characters']
  },

  panchayat: {
    type: String,
    trim: true,
    maxlength: [50, 'Panchayat must not exceed 50 characters']
  },

  gramSabha: {
    type: String,
    trim: true,
    maxlength: [50, 'Gram Sabha must not exceed 50 characters']
  },

  revenueVillage: {
    type: String,
    trim: true,
    maxlength: [50, 'Revenue Village must not exceed 50 characters']
  },

  // Performance tracking
  totalDonationsReferred: {
    type: Number,
    default: 0,
    min: [0, 'Total donations cannot be negative']
  },

  totalAmountReferred: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
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

userSchema.statics.findByReferralCode = function (code: string) {
  return this.findOne({ referralCode: code, status: UserStatus.ACTIVE })
}

userSchema.statics.getHierarchyTree = async function (userId: mongoose.Types.ObjectId) {
  const user = await this.findById(userId)
  if (!user) return null

  const buildTree = async (parentId: mongoose.Types.ObjectId): Promise<any> => {
    const children = await this.find({ parentCoordinatorId: parentId, status: UserStatus.ACTIVE })

    return Promise.all(
      children.map(async (child: IUser) => ({
        ...child.toJSON(),
        children: await buildTree(child._id)
      }))
    )
  }

  return {
    ...user.toJSON(),
    children: await buildTree(user._id)
  }
}

// Instance methods for hierarchy management
userSchema.methods.getHierarchyPath = async function (this: IUser): Promise<IUser[]> {
  const path: IUser[] = [this]
  let currentParent = this.parentCoordinatorId

  while (currentParent) {
    const parent = await User.findById(currentParent)
    if (!parent) break
    path.unshift(parent)
    currentParent = parent.parentCoordinatorId
  }

  return path
}

userSchema.methods.getSubordinates = async function (this: IUser): Promise<IUser[]> {
  return await User.find({
    parentCoordinatorId: this._id,
    status: UserStatus.ACTIVE
  })
}

userSchema.methods.canManageUser = async function (this: IUser, targetUserId: mongoose.Types.ObjectId): Promise<boolean> {
  const target = await User.findById(targetUserId)
  if (!target) return false

  // Admins can manage everyone
  if (this.role === UserRole.ADMIN) return true

  // Check if this user is higher in hierarchy
  const thisLevel = RoleHierarchy[this.role as UserRoleType]
  const targetLevel = RoleHierarchy[target.role as UserRoleType]

  if (thisLevel >= targetLevel) return false

  // Check if target is a direct subordinate or in the hierarchy tree
  let current = target
  while (current.parentCoordinatorId) {
    if (current.parentCoordinatorId.toString() === this._id.toString()) {
      return true
    }
    const parent = await User.findById(current.parentCoordinatorId)
    if (!parent) break
    current = parent
  }

  return false
}

// Validation middleware
userSchema.pre('validate', function (next) {
  // Ensure coordinator-specific fields are set for non-volunteer roles
  const hierarchyRoles: UserRoleType[] = [
    UserRole.CENTRAL_PRESIDENT,
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI
  ]

  if (hierarchyRoles.includes(this.role)) {
    if (!this.region && this.role !== UserRole.CENTRAL_PRESIDENT) {
      this.invalidate('region', 'Region is required for this role')
    }
  }

  // Ensure non-top-level roles have a parent
  if (this.role !== UserRole.ADMIN && this.role !== UserRole.CENTRAL_PRESIDENT && this.role !== UserRole.VOLUNTEER) {
    if (!this.parentCoordinatorId) {
      this.invalidate('parentCoordinatorId', 'Parent coordinator is required for this role')
    }
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
   * Check if user can manage another user based on hierarchy
   */
  canManageUser: (manager: IUser, target: IUser): boolean => {
    // Admins can manage everyone
    if (manager.role === UserRole.ADMIN) {
      return true
    }

    // Check if manager is higher in hierarchy
    const managerLevel = RoleHierarchy[manager.role]
    const targetLevel = RoleHierarchy[target.role]

    if (managerLevel >= targetLevel) {
      return false
    }

    // Check if target is in manager's hierarchy path
    return target.parentCoordinatorId?.toString() === manager._id.toString()
  },

  /**
   * Get user hierarchy path
   */
  getHierarchyPath: async (userId: mongoose.Types.ObjectId): Promise<IUser[]> => {
    const path: IUser[] = []
    let currentUser = await User.findById(userId).populate('parentCoordinatorId') as IUser | null

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