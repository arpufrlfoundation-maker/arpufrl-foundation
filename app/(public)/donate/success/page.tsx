'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'

interface DonationDetails {
  donationId: string
  paymentId: string
  amount: number
  currency: string
  donorName: string
  donorEmail?: string
  donorPhone?: string
  donorPAN?: string
  programName?: string
  referralCode?: string
  status: string
  createdAt: string
}

function DonationSuccessContent() {
  const [donation, setDonation] = useState<DonationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [receiptSent, setReceiptSent] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const searchParams = useSearchParams()
  const donationId = searchParams.get('donation')
  const paymentId = searchParams.get('payment')

  useEffect(() => {
    if (donationId && paymentId) {
      fetchDonationDetails()
    } else {
      setError('Invalid donation reference')
      setIsLoading(false)
    }
  }, [donationId, paymentId])

  const fetchDonationDetails = async () => {
    try {
      const response = await fetch(`/api/donations/${donationId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setDonation(result.data)

        // Send receipt email if email is provided
        if (result.data.donorEmail) {
          await sendReceiptEmail(result.data)
        }
      } else {
        setError(result.error || 'Failed to fetch donation details')
      }
    } catch (error) {
      console.error('Error fetching donation details:', error)
      setError('Failed to load donation details')
    } finally {
      setIsLoading(false)
    }
  }

  const sendReceiptEmail = async (donationData: DonationDetails) => {
    try {
      const response = await fetch('/api/donations/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donationId: donationData.donationId,
        }),
      })

      if (response.ok) {
        setReceiptSent(true)
      }
    } catch (error) {
      console.error('Error sending receipt:', error)
      // Don't show error to user for receipt sending failure
    }
  }

  // Resend receipt email
  const resendReceiptEmail = async () => {
    if (!donation || !donation.donorEmail) return
    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/donations/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donationId: donation.donationId,
        }),
      })

      if (response.ok) {
        setReceiptSent(true)
        alert('Receipt sent to your email!')
      } else {
        alert('Failed to send receipt. Please try again.')
      }
    } catch (error) {
      console.error('Error sending receipt:', error)
      alert('Failed to send receipt. Please try again.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateReceiptNumber = (donationId: string, createdAt: string) => {
    const date = new Date(createdAt)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const id = donationId.slice(-6).toUpperCase()
    return `ARPU-${year}${month}${day}-${id}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading donation details...</p>
        </div>
      </div>
    )
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Donation
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'We could not find the donation details. Please contact support if you need assistance.'}
            </p>
            <div className="space-y-3">
              <Link href="/donate">
                <Button className="w-full">
                  Make Another Donation
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thank You for Your Donation!
            </h1>
            <p className="text-xl text-gray-600">
              Your generous contribution will help us make a positive impact in the community.
            </p>
          </div>

          {/* Donation Receipt */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Receipt Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Donation Receipt</h2>
                  <p className="text-blue-100">
                    Receipt #: {generateReceiptNumber(donation.donationId, donation.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {formatCurrency(donation.amount, donation.currency)}
                  </p>
                  <p className="text-blue-100">Amount Donated</p>
                </div>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-6">
              {/* Donation Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Donor Name</p>
                    <p className="font-medium text-gray-900">{donation.donorName}</p>
                  </div>
                  {donation.donorEmail && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{donation.donorEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Payment ID</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">{donation.paymentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">{formatDate(donation.createdAt)}</p>
                  </div>
                  {donation.programName && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Program</p>
                      <p className="font-medium text-gray-900">{donation.programName}</p>
                    </div>
                  )}
                  {donation.referralCode && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Referral Code</p>
                      <p className="font-medium text-gray-900">{donation.referralCode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">ARPU Future Rise Life Foundation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">CIN: </span>
                      <span className="font-medium text-gray-900">U88900DL2025NPL451013</span>
                    </div>
                    <div>
                      <span className="text-gray-500">PAN: </span>
                      <span className="font-medium text-gray-900">ABDCA2272K</span>
                    </div>
                    <div>
                      <span className="text-gray-500">URN: </span>
                      <span className="font-medium text-gray-900">ABDCA2272KF20251</span>
                    </div>
                    <div>
                      <span className="text-gray-500">UDN: </span>
                      <span className="font-medium text-gray-900">ABDCA2272KF2025101</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-3">
                    Registered NGO working towards community development and social welfare
                  </p>
                  <p className="text-green-700 text-sm mt-2 font-medium">
                    ✓ This donation is eligible for tax deduction under Section 80G of the Income Tax Act.
                  </p>
                </div>
              </div>

              {/* Receipt Email Status */}
              {donation.donorEmail && (
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-3">
                    {receiptSent ? (
                      <>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Receipt sent to your email</p>
                          <p className="text-sm text-gray-600">A copy of this receipt has been sent to {donation.donorEmail}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Receipt will be sent shortly</p>
                          <p className="text-sm text-gray-600">We'll send a copy to {donation.donorEmail}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            {/* Email Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              {donation.donorEmail && (
                <Button
                  onClick={resendReceiptEmail}
                  disabled={isSendingEmail}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  <span>{isSendingEmail ? 'Sending...' : 'Email Receipt'}</span>
                </Button>
              )}
            </div>

            {/* Other Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.print()} variant="outline" className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Receipt</span>
              </Button>

              <Link href="/donate">
                <Button className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Donate Again</span>
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Help us spread the word about our mission</p>
            <div className="flex justify-center space-x-4">
              <a
                href={`https://twitter.com/intent/tweet?text=I just donated to ARPU Future Rise Life Foundation! Join me in making a difference. &url=${window.location.origin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                Share on Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Share on Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <DonationSuccessContent />
    </Suspense>
  )
}