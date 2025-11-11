'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, Shield, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { generateReferralCode } from '@/lib/generateReferral'
import { generateUniqueId } from '@/lib/utils'
import { CloudinaryService } from '@/lib/cloudinary'
import { getStateNames, getDistrictsByState } from '@/lib/indian-states-districts'

// Validation schema - confirmPassword is required and must match password
const signupSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters').max(100),
  address: z.string().min(10, 'Address must be at least 10 characters').max(200),
  district: z.string().min(2, 'District is required').max(50),
  state: z.string().min(2, 'State is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .regex(/^[\d\s-()]+$/, 'Invalid phone number - only digits allowed')
    .min(10, 'Phone must be at least 10 digits')
    .max(10, 'Phone must be 10 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.string().min(1, 'Please select a role'),
  region: z.string().min(2, 'Region is required'),
  fatherPhone: z.string()
    .regex(/^[\d\s-()]+$/, 'Invalid phone number - only digits allowed')
    .min(10, 'Phone must be at least 10 digits')
    .max(10, 'Phone must be 10 digits')
    .optional()
    .or(z.literal('')),
  motherPhone: z.string()
    .regex(/^[\d\s-()]+$/, 'Invalid phone number - only digits allowed')
    .min(10, 'Phone must be at least 10 digits')
    .max(10, 'Phone must be 10 digits')
    .optional()
    .or(z.literal(''))
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

const roleOptions = [
  { value: 'CENTRAL_PRESIDENT', label: 'Central President' },
  { value: 'STATE_PRESIDENT', label: 'State President' },
  { value: 'STATE_COORDINATOR', label: 'State Coordinator' },
  { value: 'ZONE_COORDINATOR', label: 'Zone Coordinator' },
  { value: 'DISTRICT_PRESIDENT', label: 'District President' },
  { value: 'DISTRICT_COORDINATOR', label: 'District Coordinator' },
  { value: 'BLOCK_COORDINATOR', label: 'Block Coordinator' },
  { value: 'NODAL_OFFICER', label: 'Nodal Officer' },
  { value: 'PRERAK', label: 'Prerak' },
  { value: 'PRERNA_SAKHI', label: 'Prerna Sakhi' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
]

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedReferralCode, setGeneratedReferralCode] = useState<string>('')
  const [uniqueId, setUniqueId] = useState<string>('')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // State and District data
  const [statesList] = useState<string[]>(getStateNames())
  const [districtsList, setDistrictsList] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      confirmPassword: '', // Set default value to prevent undefined
    }
  })

  const selectedRole = watch('role')
  const watchedState = watch('state')

  // Update districts when state changes
  useEffect(() => {
    if (watchedState && watchedState !== selectedState) {
      setSelectedState(watchedState)
      const districts = getDistrictsByState(watchedState)
      setDistrictsList(districts)
      setValue('district', '') // Reset district when state changes
    }
  }, [watchedState, selectedState, setValue])

  // Generate unique ID on mount
  useEffect(() => {
    setUniqueId(generateUniqueId())
  }, [])

  // Auto-generate referral code when role changes
  useEffect(() => {
    if (selectedRole) {
      const code = generateReferralCode(selectedRole)
      setGeneratedReferralCode(code)
    }
  }, [selectedRole])

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadProfilePhoto(file)
      if (result.success && result.url) {
        setProfilePhoto(result.url)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = () => {
    setProfilePhoto(null)
    setPhotoPreview(null)
  }

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
          fatherName: data.fatherName,
          address: data.address,
          district: data.district,
          state: data.state,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          phone: data.phone,
          role: data.role,
          region: data.region,
          referralCode: generatedReferralCode,
          uniqueId: uniqueId,
          profilePhoto: profilePhoto,
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
              {/* Unique ID Display */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Your Unique ID:</span>{' '}
                  <span className="font-mono font-bold">{uniqueId}</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">Save this ID for future reference</p>
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </>
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP (max 5MB)</p>
                  </div>
                </div>
              </div>

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

              {/* Father's Name */}
              <div>
                <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Father's Name *
                </label>
                <input
                  id="fatherName"
                  type="text"
                  {...register('fatherName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter father's name"
                />
                {errors.fatherName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fatherName.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address *
                </label>
                <textarea
                  id="address"
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* State and District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">
                    State *
                  </label>
                  <select
                    id="state"
                    {...register('state')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select State</option>
                    {statesList.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1.5">
                    District *
                  </label>
                  <select
                    id="district"
                    {...register('district')}
                    disabled={!selectedState || districtsList.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedState ? 'Select District' : 'Select State First'}
                    </option>
                    {districtsList.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1 text-sm text-red-600">{errors.district.message}</p>
                  )}
                </div>
              </div>

              {/* Mobile Number (Phone) - India only, no +91 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number * <span className="text-gray-500 text-xs">(10 digits)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email ID *
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
                      Father's Phone Number <span className="text-gray-500 text-xs">(Optional, 10 digits)</span>
                    </label>
                    <input
                      id="fatherPhone"
                      type="tel"
                      {...register('fatherPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    {errors.fatherPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.fatherPhone.message}</p>
                    )}
                  </div>

                  {/* Mother's Phone */}
                  <div>
                    <label htmlFor="motherPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mother's Phone Number <span className="text-gray-500 text-xs">(Optional, 10 digits)</span>
                    </label>
                    <input
                      id="motherPhone"
                      type="tel"
                      {...register('motherPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="9876543210"
                      maxLength={10}
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
