'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface AnalyticsData {
  overview: {
    totalAmount: number
    totalDonations: number
    averageDonation: number
    conversionRate: number
    activeSubCoordinators: number
  }
  trends: {
    date: string
    amount: number
    donations: number
  }[]
  topPerformers: {
    id: string
    name: string
    totalAmount: number
    totalDonations: number
    conversionRate: number
  }[]
  recentDonations: {
    id: string
    donorName: string
    amount: number
    createdAt: string
    programName?: string
    referralCode: string
    attributedTo: string
  }[]
  codeUsage: {
    code: string
    usageCount: number
    totalAmount: number
    lastUsed?: string
  }[]
}

interface TimeRange {
  label: string
  value: string
  days: number
}

const timeRanges: TimeRange[] = [
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'Last Year', value: '1y', days: 365 }
]

export default function ReferralAnalytics() {
  const { data: session } = useSession()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[1]) // Default to 30 days

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalyticsData()
    }
  }, [session, selectedTimeRange])

  const fetchAnalyticsData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/referrals/analytics?userId=${session.user.id}&timeRange=${selectedTimeRange.value}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold * 1.5) return 'text-green-600'
    if (value >= threshold) return 'text-blue-600'
    if (value >= threshold * 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-red-400">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h4>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h4>
          <p className="text-gray-600">No referral data available for the selected time period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Referral Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">
              Track your referral performance and optimize your fundraising strategy
            </p>
          </div>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${selectedTimeRange.value === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analyticsData.overview.totalAmount)}
            </div>
            <div className="text-sm text-blue-800">Total Raised</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.overview.totalDonations}
            </div>
            <div className="text-sm text-green-800">Total Donations</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analyticsData.overview.averageDonation)}
            </div>
            <div className="text-sm text-purple-800">Average Donation</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsData.overview.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-yellow-800">Conversion Rate</div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {analyticsData.overview.activeSubCoordinators}
            </div>
            <div className="text-sm text-indigo-800">Active Sub-Coordinators</div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Trends</h4>

        {analyticsData.trends.length > 0 ? (
          <div className="space-y-4">
            {/* Simple bar chart representation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Amount Trend */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Daily Amount Raised</h5>
                <div className="space-y-2">
                  {analyticsData.trends.slice(-7).map((trend, index) => {
                    const maxAmount = Math.max(...analyticsData.trends.map(t => t.amount))
                    const percentage = maxAmount > 0 ? (trend.amount / maxAmount) * 100 : 0

                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-16 text-xs text-gray-600">
                          {formatDate(trend.date)}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-20 text-xs text-gray-900 text-right">
                          {formatCurrency(trend.amount)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Donations Trend */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Daily Donations Count</h5>
                <div className="space-y-2">
                  {analyticsData.trends.slice(-7).map((trend, index) => {
                    const maxDonations = Math.max(...analyticsData.trends.map(t => t.donations))
                    const percentage = maxDonations > 0 ? (trend.donations / maxDonations) * 100 : 0

                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-16 text-xs text-gray-600">
                          {formatDate(trend.date)}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-green-600 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-gray-900 text-right">
                          {trend.donations}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No trend data available for the selected period
          </div>
        )}
      </div>

      {/* Top Performers and Code Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Performing Sub-Coordinators</h4>

          {analyticsData.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-600">
                        {performer.totalDonations} donations • {performer.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(performer.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sub-coordinator performance data available
            </div>
          )}
        </div>

        {/* Referral Code Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Referral Code Usage</h4>

          {analyticsData.codeUsage.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.codeUsage.map((usage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{usage.code}</p>
                    <p className="text-sm text-gray-600">
                      {usage.usageCount} uses
                      {usage.lastUsed && (
                        <span> • Last used {formatDate(usage.lastUsed)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(usage.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No referral code usage data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Attributed Donations</h4>

        {analyticsData.recentDonations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Donor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Referral Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Attributed To</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.recentDonations.map((donation) => (
                  <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{donation.donorName}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(donation.amount)}</td>
                    <td className="py-3 px-4">{donation.programName || 'General'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{donation.referralCode}</td>
                    <td className="py-3 px-4">{donation.attributedTo}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(donation.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent donations to display
          </div>
        )}
      </div>

      {/* Optimization Suggestions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h4 className="text-md font-semibold text-blue-900 mb-4">💡 Optimization Suggestions</h4>
        <div className="space-y-3 text-sm">
          {analyticsData.overview.conversionRate < 5 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <p className="text-blue-800">
                Your conversion rate is below 5%. Consider providing more training to your sub-coordinators on effective fundraising techniques.
              </p>
            </div>
          )}

          {analyticsData.overview.averageDonation < 1000 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <p className="text-blue-800">
                Average donation amount is low. Focus on promoting higher-impact programs or suggest donation amounts.
              </p>
            </div>
          )}

          {analyticsData.overview.activeSubCoordinators === 0 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <p className="text-blue-800">
                Consider recruiting sub-coordinators to expand your network and increase fundraising reach.
              </p>
            </div>
          )}

          {analyticsData.topPerformers.length > 0 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <p className="text-blue-800">
                Learn from your top performers and share their successful strategies with other sub-coordinators.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}