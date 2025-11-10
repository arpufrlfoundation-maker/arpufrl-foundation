'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'
import { generateReferralCode } from '@/lib/generateReferral'

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  phone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number')
    .min(10, 'Phone must be at least 10 digits'),
  role: z.string().min(1, 'Please select a role'),
  region: z.string().min(2, 'Region/District/State is required'),
  fatherPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number')
    .min(10, 'Phone must be at least 10 digits')
    .optional()
    .or(z.literal('')),
  motherPhone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number')
    .min(10, 'Phone must be at least 10 digits')
    .optional()
    .or(z.literal(''))
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

const roleOptions = [
  { value: 'NATIONAL_LEVEL', label: 'National Level' },
  { value: 'STATE_ADHYAKSH', label: 'State Adhyaksh' },
  { value: 'STATE_COORDINATOR', label: 'State Coordinator' },
  { value: 'MANDAL_COORDINATOR', label: 'Mandal Coordinator' },
  { value: 'JILA_ADHYAKSH', label: 'Jila Adhyaksh' },
  { value: 'JILA_COORDINATOR', label: 'Jila Coordinator' },
  { value: 'BLOCK_COORDINATOR', label: 'Block Coordinator' },
  { value: 'NODEL', label: 'Nodel' },
  { value: 'PRERAK', label: 'Prerak' },
  { value: 'PRERNA_SAKHI', label: 'Prerna Sakhi' },
]

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedReferralCode, setGeneratedReferralCode] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const selectedRole = watch('role')

  // Auto-generate referral code when role changes
  useEffect(() => {
    if (selectedRole) {
      const code = generateReferralCode(selectedRole)
      setGeneratedReferralCode(code)
    }
  }, [selectedRole])

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          role: data.role,
          region: data.region,
          referralCode: generatedReferralCode,
          // Optional parent phone numbers
          ...(data.fatherPhone && { fatherPhone: data.fatherPhone }),
          ...(data.motherPhone && { motherPhone: data.motherPhone }),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed')
      }

      // Success - redirect to login
      router.push('/login?message=signup_success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Create Account</h1>
            <p className="text-gray-600 text-center mt-1">Join ARPUFRL to make a difference</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91 1234567890"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role *
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select your role</option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                {generatedReferralCode && (
                  <p className="mt-2 text-sm text-blue-600 font-medium">
                    Your referral code: <span className="font-mono bg-blue-50 px-2 py-1 rounded">{generatedReferralCode}</span>
                  </p>
                )}
              </div>

              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Region / District / State *
                </label>
                <input
                  id="region"
                  type="text"
                  {...register('region')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Maharashtra, Mumbai"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                )}
              </div>

              {/* Emergency Contact Section */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Emergency Contact (Optional)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Father's Phone */}
                  <div>
                    <label htmlFor="fatherPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Father's Phone Number
                    </label>
                    <input
                      id="fatherPhone"
                      type="tel"
                      {...register('fatherPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+91 1234567890"
                    />
                    {errors.fatherPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.fatherPhone.message}</p>
                    )}
                  </div>

                  {/* Mother's Phone */}
                  <div>
                    <label htmlFor="motherPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mother's Phone Number
                    </label>
                    <input
                      id="motherPhone"
                      type="tel"
                      {...register('motherPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+91 1234567890"
                    />
                    {errors.motherPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.motherPhone.message}</p>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-600 flex items-start gap-2">
                  <Shield className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    Your family contact details are confidential and used only for emergency verification.
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
