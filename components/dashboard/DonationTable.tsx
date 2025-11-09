'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  X
} from 'lucide-react'

interface Donation {
  _id: string
  donorName: string
  donorEmail?: string
  donorPhone?: string
  amount: number
  currency: string
  program?: {
    _id: string
    name: string
  }
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  razorpayOrderId: string
  razorpayPaymentId?: string
  referralCode?: {
    code: string
    ownerName: string
  }
  createdAt: string
  updatedAt: string
}

interface DonationFilters {
  search: string
  status: string
  program: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

interface DonationTableProps {
  filters: DonationFilters
}

export default function DonationTable({ filters }: DonationTableProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const itemsPerPage = 10

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  useEffect(() => {
    fetchDonations()
  }, [currentPage, filters])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())

      // Add filters
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.program) queryParams.append('program', filters.program)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount)
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount)

      const response = await fetch(`/api/admin/donations?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch donations')
      }

      const data = await response.json()
      setDonations(data.donations || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)

    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDonations([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUCCESS: { bg: 'bg-green-100', text: 'text-green-800', label: 'Success' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const viewDonationDetails = (donation: Donation) => {
    setSelectedDonation(donation)
    setShowDetails(true)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">Error loading donations</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDonations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Donations ({totalCount.toLocaleString()})
          </h3>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referral
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.length > 0 ? (
              donations.map((donation) => (
                <tr key={donation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(donation.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {donation.donorName}
                    </div>
                    {donation.donorEmail && (
                      <div className="text-sm text-gray-500">
                        {donation.donorEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.program?.name || 'General Fund'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(donation.paymentStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.referralCode ? (
                      <div>
                        <div className="font-medium">{donation.referralCode.code}</div>
                        <div className="text-xs text-gray-500">{donation.referralCode.ownerName}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Direct</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewDonationDetails(donation)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {donation.razorpayPaymentId && (
                        <a
                          href={`https://dashboard.razorpay.com/app/payments/${donation.razorpayPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          title="View in Razorpay"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No donations found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="hidden sm:flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Details Modal */}
      {showDetails && selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetails(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Donation Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Details Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedDonation.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <p className="text-sm text-gray-900">{selectedDonation.program?.name || 'General Fund'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedDonation.paymentStatus)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Order ID</label>
                    <p className="text-sm text-gray-900 font-mono text-xs break-all">{selectedDonation.razorpayOrderId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Payment ID</label>
                    <p className="text-sm text-gray-900 font-mono text-xs break-all">
                      {selectedDonation.razorpayPaymentId || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDonation.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDonation.updatedAt)}</p>
                  </div>
                </div>

                {selectedDonation.referralCode && (
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Referral Information</label>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-medium text-blue-900">Code:</span>
                          <p className="text-sm font-semibold text-blue-900 mt-1">{selectedDonation.referralCode.code}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-blue-900">Coordinator:</span>
                          <p className="text-sm font-semibold text-blue-900 mt-1">{selectedDonation.referralCode.ownerName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}