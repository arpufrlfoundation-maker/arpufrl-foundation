'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react'

interface Donation {
  id: string
  donorName: string
  donorEmail?: string
  donorPhone?: string
  amount: number
  currency: string
  program?: {
    id: string
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

interface SortConfig {
  key: keyof Donation | 'amount' | 'createdAt'
  direction: 'asc' | 'desc'
}

export default function DonationTable({ filters }: DonationTableProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' })
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const itemsPerPage = 20

  useEffect(() => {
    fetchDonations()
  }, [filters, currentPage, sortConfig])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      // Add pagination and sorting
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('sortBy', sortConfig.key)
      queryParams.append('sortOrder', sortConfig.direction)

      const response = await fetch(`/api/admin/donations?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch donations')
      }

      const data = await response.json()
      setDonations(data.donations)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: keyof Donation | 'amount' | 'createdAt') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: keyof Donation | 'amount' | 'createdAt') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">Error loading donations</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchDonations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
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
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Date</span>
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('donorName')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Donor</span>
                  {getSortIcon('donorName')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Amount</span>
                  {getSortIcon('amount')}
                </button>
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
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(donation.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {donation.donorName}
                      </div>
                      {donation.donorEmail && (
                        <div className="text-sm text-gray-500">
                          {donation.donorEmail}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                        <div className="text-gray-500">{donation.referralCode.ownerName}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Direct</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewDonationDetails(donation)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {donation.razorpayPaymentId && (
                      <a
                        href={`https://dashboard.razorpay.com/app/payments/${donation.razorpayPaymentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
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
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetails(false)} />

            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Donation Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Donor Name</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedDonation.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedDonation.donorPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Program</label>
                    <p className="text-sm text-gray-900">{selectedDonation.program?.name || 'General Fund'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedDonation.paymentStatus)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razorpay Order ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedDonation.razorpayOrderId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razorpay Payment ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedDonation.razorpayPaymentId || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDonation.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDonation.updatedAt)}</p>
                  </div>
                </div>

                {selectedDonation.referralCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referral Information</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Code:</span> {selectedDonation.referralCode.code}
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Coordinator:</span> {selectedDonation.referralCode.ownerName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}