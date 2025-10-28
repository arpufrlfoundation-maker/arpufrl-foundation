'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Donation {
  _id: string
  amount: number
  currency: string
  donorName: string
  donorEmail?: string
  programName?: string
  referralCode?: string
  paymentStatus: string
  razorpayPaymentId?: string
  createdAt: string
}

interface DonationHistoryProps {
  userEmail?: string
  className?: string
}

export default function DonationHistory({ userEmail, className }: DonationHistoryProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (userEmail) {
      fetchDonationHistory()
    }
  }, [userEmail, currentPage])

  const fetchDonationHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/donations?email=${encodeURIComponent(userEmail!)}&page=${currentPage}&limit=10`)
      const result = await response.json()

      if (response.ok && result.success) {
        setDonations(result.data.donations)
        setTotalPages(result.data.pagination.totalPages)
      } else {
        setError(result.error || 'Failed to fetch donation history')
      }
    } catch (error) {
      console.error('Error fetching donation history:', error)
      setError('Failed to load donation history')
    } finally {
      setIsLoading(false)
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
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUCCESS: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      REFUNDED: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const downloadReceipt = async (donationId: string) => {
    try {
      // In a real implementation, this would generate and download a PDF receipt
      window.open(`/donate/success?donation=${donationId}`, '_blank')
    } catch (error) {
      console.error('Error downloading receipt:', error)
    }
  }

  if (!userEmail) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Please log in to view your donation history</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading donation history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDonationHistory} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
        <p className="text-gray-500 mb-4">You haven't made any donations yet. Start making a difference today!</p>
        <Button onClick={() => window.location.href = '/donate'}>
          Make Your First Donation
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your Donation History
          </h3>

          {/* Donations List */}
          <div className="space-y-4">
            {donations.map((donation) => (
              <div
                key={donation._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(donation.amount, donation.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(donation.createdAt)}
                        </p>
                      </div>

                      <div className="flex-1">
                        {donation.programName ? (
                          <p className="text-sm font-medium text-gray-900">
                            {donation.programName}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">General Donation</p>
                        )}

                        {donation.referralCode && (
                          <p className="text-xs text-gray-500">
                            Referral: {donation.referralCode}
                          </p>
                        )}

                        {donation.razorpayPaymentId && (
                          <p className="text-xs text-gray-500 font-mono">
                            Payment ID: {donation.razorpayPaymentId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getStatusBadge(donation.paymentStatus)}

                    {donation.paymentStatus === 'SUCCESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReceipt(donation._id)}
                        className="text-xs"
                      >
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}