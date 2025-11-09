'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DonationForm from '@/components/forms/DonationForm'
import { donationFormSchema } from '@/lib/validations'
import { usePayment } from '@/lib/hooks/usePayment'
import { generateBreadcrumbStructuredData } from '@/lib/seo'
import { z } from 'zod'

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

function DonatePageContent() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const programId = searchParams.get('program')
  const referralCode = searchParams.get('ref')

  const {
    isLoading: paymentLoading,
    error: paymentError,
    isProcessing,
    initiatePayment,
    clearError,
    reset
  } = usePayment()

  // Fetch programs on component mount
  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPrograms(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      // Continue without programs if fetch fails
    }
  }

  const handleDonationSubmit = async (data: DonationFormData) => {
    setSubmitError(null)
    clearError()

    try {
      // Create donation order
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorName: data.donorName,
          donorEmail: data.donorEmail || undefined,
          donorPhone: data.donorPhone || undefined,
          amount: data.amount,
          programId: data.programId || undefined,
          referralCode: data.referralCode || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create donation order')
      }

      if (result.success) {
        // Initialize payment using the hook
        await initiatePayment(
          result.data,
          {
            name: data.donorName,
            email: data.donorEmail,
            phone: data.donorPhone,
          },
          {
            onSuccess: (paymentId, donationId) => {
              // Redirect to success page
              router.push(`/donate/success?donation=${donationId}&payment=${paymentId}`)
            },
            onError: (error) => {
              setSubmitError(error)
            },
            onCancel: () => {
              setSubmitError('Payment was cancelled. You can try again.')
            }
          }
        )
      } else {
        throw new Error(result.error || 'Failed to create donation order')
      }
    } catch (error) {
      console.error('Donation submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  // Combined loading state
  const isLoading = paymentLoading || isProcessing

  // Combined error state
  const error = submitError || paymentError

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Donate', url: '/donate' },
  ]

  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <>
      {/* Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Make a Donation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your contribution helps us create positive change in communities.
              Every donation, no matter the size, makes a meaningful impact.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {isProcessing ? 'Processing Payment' : 'Payment Error'}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Message */}
          {isProcessing && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Processing Payment
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Please wait while we verify your payment. Do not close this window.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Donation Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <DonationForm
              programs={programs}
              selectedProgramId={programId || undefined}
              referralCode={referralCode || undefined}
              onSubmit={handleDonationSubmit}
              isLoading={isLoading}
            />
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
                <p className="text-gray-600 text-center">
                  All transactions are encrypted and processed securely through Razorpay
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tax Deductible</h3>
                <p className="text-gray-600 text-center">
                  All donations are eligible for tax deduction under Section 80G
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Impact</h3>
                <p className="text-gray-600 text-center">
                  Your donation immediately goes towards helping those in need
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Make a Donation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Loading donation form...
            </p>
          </div>
        </div>
      </div>
    }>
      <DonatePageContent />
    </Suspense>
  )
}