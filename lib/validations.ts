// Zod validation schemas for forms and API validation
import { z } from 'zod'

// Donation form validation schema
export const donationFormSchema = z.object({
  // Amount selection
  amount: z.number()
    .min(100, 'Minimum donation amount is ₹100')
    .max(100000, 'Maximum donation amount is ₹100,000')
    .int('Amount must be a whole number'),

  // Donor information
  donorName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  donorEmail: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),

  donorPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .optional()
    .or(z.literal('')),

  // Donor PAN - mandatory for tax deduction certificate
  donorPAN: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN (e.g., ABCDE1234F)')
    .length(10, 'PAN must be exactly 10 characters')
    .transform(val => val.toUpperCase()),

  // Program selection
  programId: z.string()
    .min(1, 'Please select a program')
    .regex(/^[0-9a-fA-F]{24}$/, 'Please select a valid program'),

  // Referral code
  referralCode: z.string()
    .min(3, 'Referral code must be at least 3 characters')
    .max(50, 'Referral code must not exceed 50 characters')
    .optional()
    .or(z.literal('')),

  // Privacy preferences
  isAnonymous: z.boolean().default(false).optional(),

  hideFromPublicDisplay: z.boolean().default(false).optional(),

  displayName: z.string()
    .max(100, 'Display name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),

  allowPublicRecognition: z.boolean().default(true).optional(),

  showAmountPublicly: z.boolean().default(true).optional(),

  showDatePublicly: z.boolean().default(false).optional(),

  preferredDisplayFormat: z.enum(['name_amount', 'name_only', 'amount_only', 'anonymous']).default('name_amount').optional(),

  // Consent fields
  privacyConsentGiven: z.boolean()
    .refine(val => val === true, 'You must consent to data processing'),

  dataProcessingConsent: z.boolean()
    .refine(val => val === true, 'You must consent to data processing'),

  marketingConsent: z.boolean().default(false).optional(),

  // Terms acceptance
  acceptTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
})

// Preset donation amounts
export const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000] as const

// User registration/login schemas
export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),

  email: z.string()
    .email('Please enter a valid email address'),

  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters'),

  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
})