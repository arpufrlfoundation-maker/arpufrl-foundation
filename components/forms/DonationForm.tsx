'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { donationFormSchema, PRESET_AMOUNTS } from '@/lib/validations'
import { cn } from '@/lib/utils'

type DonationFormData = z.infer<typeof donationFormSchema>

interface Program {
  _id: string
  name: string
  slug: string
  description: string
  targetAmount?: number
  raisedAmount: number
  active: boolean
}

interface DonationFormProps {
  programs?: Program[]
  selectedProgramId?: string
  referralCode?: string
  onSubmit: (data: DonationFormData) => Promise<void>
  isLoading?: boolean
  className?: string
}

export default function DonationForm({
  programs = [],
  selectedProgramId,
  referralCode,
  onSubmit,
  isLoading = false,
  className
}: DonationFormProps) {
  const [customAmount, setCustomAmount] = useState<string>('')
  const [showCustomAmount, setShowCustomAmount] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      programId: selectedProgramId || '',
      referralCode: referralCode || '',
      acceptTerms: false,
      isAnonymous: false,
      hideFromPublicDisplay: false,
      allowPublicRecognition: true,
      showAmountPublicly: true,
      showDatePublicly: false,
      preferredDisplayFormat: 'name_amount',
      privacyConsentGiven: false,
      dataProcessingConsent: false,
      marketingConsent: false
    }
  })

  const watchedAmount = watch('amount')

  // Set initial program selection
  useEffect(() => {
    if (selectedProgramId) {
      setValue('programId', selectedProgramId)
    }
  }, [selectedProgramId, setValue])

  // Set initial referral code
  useEffect(() => {
    if (referralCode) {
      setValue('referralCode', referralCode)
    }
  }, [referralCode, setValue])

  const handleAmountSelect = (amount: number) => {
    setValue('amount', amount)
    setShowCustomAmount(false)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      setValue('amount', numValue)
    }
  }

  const handleCustomAmountToggle = () => {
    setShowCustomAmount(true)
    setValue('amount', 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const isFormLoading = isLoading || isSubmitting

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Select Donation Amount
            </h3>

            {/* Preset Amount Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={cn(
                    'p-3 border-2 rounded-lg text-center font-medium transition-all',
                    'hover:border-blue-500 hover:bg-blue-50',
                    watchedAmount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700'
                  )}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              {!showCustomAmount ? (
                <button
                  type="button"
                  onClick={handleCustomAmountToggle}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  Enter Custom Amount
                </button>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={cn(
                      'w-full pl-8 pr-4 py-3 border-2 rounded-lg',
                      'focus:border-blue-500 focus:outline-none',
                      errors.amount ? 'border-red-500' : 'border-gray-200'
                    )}
                    min="100"
                    max="100000"
                  />
                </div>
              )}
            </div>

            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        {/* Program Selection */}
        {programs.length > 0 && (
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900">
              Select Program (Optional)
            </label>
            <select
              {...register('programId')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg',
                'focus:border-blue-500 focus:outline-none',
                errors.programId ? 'border-red-500' : 'border-gray-200'
              )}
            >
              <option value="">General Donation</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>
            {errors.programId && (
              <p className="text-red-600 text-sm">{errors.programId.message}</p>
            )}
          </div>
        )}

        {/* Donor Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Donor Information
          </h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              {...register('donorName')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg',
                'focus:border-blue-500 focus:outline-none',
                errors.donorName ? 'border-red-500' : 'border-gray-200'
              )}
              placeholder="Enter your full name"
            />
            {errors.donorName && (
              <p className="text-red-600 text-sm mt-1">{errors.donorName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              {...register('donorEmail')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg',
                'focus:border-blue-500 focus:outline-none',
                errors.donorEmail ? 'border-red-500' : 'border-gray-200'
              )}
              placeholder="Enter your email address"
            />
            {errors.donorEmail && (
              <p className="text-red-600 text-sm mt-1">{errors.donorEmail.message}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              We'll send your donation receipt to this email
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              {...register('donorPhone')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg',
                'focus:border-blue-500 focus:outline-none',
                errors.donorPhone ? 'border-red-500' : 'border-gray-200'
              )}
              placeholder="Enter your phone number"
            />
            {errors.donorPhone && (
              <p className="text-red-600 text-sm mt-1">{errors.donorPhone.message}</p>
            )}
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Referral Code (Optional)
          </label>
          <input
            type="text"
            {...register('referralCode')}
            className={cn(
              'w-full px-4 py-3 border-2 rounded-lg',
              'focus:border-blue-500 focus:outline-none',
              errors.referralCode ? 'border-red-500' : 'border-gray-200'
            )}
            placeholder="Enter referral code if you have one"
          />
          {errors.referralCode && (
            <p className="text-red-600 text-sm">{errors.referralCode.message}</p>
          )}
          <p className="text-gray-500 text-sm">
            If you were referred by a coordinator, enter their code here
          </p>
        </div>

        {/* Privacy Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Privacy Preferences
          </h3>

          {/* Anonymous Donation */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('isAnonymous')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Make this donation anonymous
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Your name will not be displayed publicly. You will appear as "Anonymous Donor"
                </p>
              </div>
            </div>
          </div>

          {/* Display Name (only if not anonymous) */}
          {!watch('isAnonymous') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Display Name (Optional)
              </label>
              <input
                type="text"
                {...register('displayName')}
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-lg',
                  'focus:border-blue-500 focus:outline-none',
                  errors.displayName ? 'border-red-500' : 'border-gray-200'
                )}
                placeholder="Leave blank to use your full name"
              />
              {errors.displayName && (
                <p className="text-red-600 text-sm mt-1">{errors.displayName.message}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                This name will be shown in donor highlights instead of your full name
              </p>
            </div>
          )}

          {/* Public Recognition */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('allowPublicRecognition')}
                defaultChecked={true}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow public recognition
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Include my donation in public donor highlights and recognition displays
                </p>
              </div>
            </div>
          </div>

          {/* Display Options (only if public recognition is allowed) */}
          {watch('allowPublicRecognition') && !watch('isAnonymous') && (
            <div className="space-y-3 pl-7">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  {...register('showAmountPublicly')}
                  defaultChecked={true}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Show donation amount publicly
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  {...register('showDatePublicly')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Show donation date publicly
                </label>
              </div>
            </div>
          )}

          {/* Hide from Public Display */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('hideFromPublicDisplay')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Keep my donation completely private
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Do not include my donation in any public displays or statistics
                </p>
              </div>
            </div>
          </div>

          {/* Marketing Consent */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('marketingConsent')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Send me updates about programs and impact
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Receive newsletters and updates about how your donation is making a difference
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Consents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Required Consents
          </h3>

          {/* Privacy Consent */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('privacyConsentGiven')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  I consent to the processing of my personal data *
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Required for donation processing, receipt generation, and tax compliance
                </p>
              </div>
            </div>
            {errors.privacyConsentGiven && (
              <p className="text-red-600 text-sm">{errors.privacyConsentGiven.message}</p>
            )}
          </div>

          {/* Data Processing Consent */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                {...register('dataProcessingConsent')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  I consent to data processing for donation management *
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Allows us to process your donation, send receipts, and maintain donation records
                </p>
              </div>
            </div>
            {errors.dataProcessingConsent && (
              <p className="text-red-600 text-sm">{errors.dataProcessingConsent.message}</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">
              I accept the{' '}
              <a
                href="/terms"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-600 text-sm">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isFormLoading}
            className="w-full py-4 text-lg font-semibold"
            size="lg"
          >
            {isFormLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Donate ${watchedAmount ? formatCurrency(watchedAmount) : ''}`
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500 pt-2">
          <p>🔒 Your payment is secured by Razorpay</p>
          <p>All donations are processed securely and are tax-deductible</p>
        </div>
      </form>
    </div>
  )
}