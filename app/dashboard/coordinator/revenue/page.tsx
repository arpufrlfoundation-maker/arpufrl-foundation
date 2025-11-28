'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Download, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Commission {
  _id: string
  donationId: {
    _id: string
    amount: number
    donorName: string
    createdAt: string
  }
  commissionAmount: number
  commissionPercentage: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  createdAt: string
  paidAt?: string
}

interface RevenueSummary {
  totalEarned: number
  pending: number
  paid: number
  failed: number
  commissionCount: number
}

const emptyRevenueSummary: RevenueSummary = {
  totalEarned: 0,
  pending: 0,
  paid: 0,
  failed: 0,
  commissionCount: 0
}

export default function CoordinatorRevenuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<RevenueSummary>(emptyRevenueSummary)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL')
  const hasFetched = useRef(false)

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Add timestamp to prevent any caching
      const timestamp = Date.now()
      const response = await fetch(`/api/revenue/commissions?_t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSummary(result.summary || emptyRevenueSummary)
        setCommissions(result.commissions || [])
      } else {
        setError(result.error || 'Failed to load data')
        setSummary(emptyRevenueSummary)
        setCommissions([])
      }
    } catch (err) {
      console.error('Error fetching revenue:', err)
      setError(err instanceof Error ? err.message : 'Failed to load revenue data')
      setSummary(emptyRevenueSummary)
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Wait for session to be determined
    if (status === 'loading') return

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Only fetch once when session is authenticated
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      fetchRevenueData()
    }
  }, [status, router, fetchRevenueData])

  const filteredCommissions = commissions.filter(c =>
    filter === 'ALL' || c.status === filter
  )

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const downloadReport = () => {
    // Create CSV content
    const headers = ['Date', 'Donor Name', 'Donation Amount', 'Commission %', 'Commission Amount', 'Status']
    const rows = filteredCommissions.map(c => [
      formatDate(c.createdAt),
      c.donationId.donorName,
      c.donationId.amount,
      c.commissionPercentage,
      c.commissionAmount,
      c.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Revenue Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              hasFetched.current = false
              fetchRevenueData()
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your earnings and commissions</p>
            </div>

            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-5 w-5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Earned</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.totalEarned)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.commissionCount} commissions</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.pending)}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Paid</p>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.paid)}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Avg Commission</p>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.commissionCount > 0
                ? formatAmount(summary.totalEarned / summary.commissionCount)
                : '₹0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per donation</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'PENDING'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'PAID'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    Donation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((commission) => (
                    <tr key={commission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(commission.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.donationId.donorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(commission.donationId.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(commission.commissionAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.commissionPercentage}%
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${commission.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : commission.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commission.paidAt ? formatDate(commission.paidAt) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No commissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
