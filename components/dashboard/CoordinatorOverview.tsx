'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, Target, Calendar, Award } from 'lucide-react'
import StatsCard from './StatsCard'

interface CoordinatorStats {
  totalRaised: number
  totalDonations: number
  averageDonation: number
  subCoordinators: number
  thisMonthRaised: number
  thisMonthDonations: number
  rank?: number
  totalCoordinators?: number
}

interface CoordinatorOverviewProps {
  userId: string
}

export default function CoordinatorOverview({ userId }: CoordinatorOverviewProps) {
  const [stats, setStats] = useState<CoordinatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCoordinatorStats()
  }, [userId])

  const fetchCoordinatorStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/coordinators/${userId}/stats`)

      if (!response.ok) {
        throw new Error('Failed to fetch coordinator stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching coordinator stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-red-500">⚠️</div>
          <h3 className="text-red-800 font-medium">Error Loading Stats</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={fetchCoordinatorStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No statistics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Raised"
          value={formatCurrency(stats.totalRaised)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          trend={stats.thisMonthRaised > 0 ? {
            value: stats.thisMonthRaised,
            label: `${formatCurrency(stats.thisMonthRaised)} this month`
          } : undefined}
        />

        <StatsCard
          title="Total Donations"
          value={stats.totalDonations.toString()}
          icon={<Target className="w-5 h-5 text-green-600" />}
          trend={stats.thisMonthDonations > 0 ? {
            value: stats.thisMonthDonations,
            label: `${stats.thisMonthDonations} this month`
          } : undefined}
        />

        <StatsCard
          title="Average Donation"
          value={formatCurrency(stats.averageDonation)}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          description="Per donation"
        />

        <StatsCard
          title="Sub-Coordinators"
          value={stats.subCoordinators.toString()}
          icon={<Users className="w-5 h-5 text-orange-600" />}
          description="Active members"
        />
      </div>

      {/* Performance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Month's Performance</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-600">Amount Raised</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(stats.thisMonthRaised)}
                </p>
              </div>
              <div className="text-blue-600">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-600">Donations Count</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.thisMonthDonations}
                </p>
              </div>
              <div className="text-green-600">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Ranking & Recognition */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Ranking</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>

          {stats.rank && stats.totalCoordinators ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  #{stats.rank}
                </p>
                <p className="text-sm text-gray-600">
                  out of {stats.totalCoordinators} coordinators
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  {stats.rank <= 3
                    ? "🎉 Excellent performance! Keep up the great work!"
                    : stats.rank <= 10
                      ? "👏 Great job! You're in the top performers."
                      : "💪 Keep pushing forward to improve your ranking!"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ranking data not available</p>
              <p className="text-sm text-gray-400 mt-1">
                Start raising funds to see your ranking
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Manage Sub-Coordinators</span>
          </button>

          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">View Analytics</span>
          </button>

          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Track Donations</span>
          </button>
        </div>
      </div>
    </div>
  )
}