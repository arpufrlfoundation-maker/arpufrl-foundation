'use client'

import { useEffect, useState } from 'react'
import {
  Target as TargetIcon,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface TargetDashboardProps {
  userId?: string
}

interface TargetStats {
  hasTarget: boolean
  target?: {
    id: string
    targetAmount: number
    collectedAmount: number
    teamCollectedAmount: number
    totalCollected: number
    remainingAmount: number
    completionPercentage: number
    status: string
    startDate: string
    endDate: string
    daysRemaining: number
    dailyAverageNeeded: number
    description?: string
    level: string
    assignedBy?: {
      name: string
      email: string
    }
  }
  hierarchy?: {
    personalCollection: number
    teamCollection: number
    totalCollection: number
    achievementPercentage: number
    subordinatesCount: number
    teamBreakdown: Array<{
      userId: string
      name: string
      level: string
      collected: number
      percentage: number
    }>
    topPerformers: Array<{
      userId: string
      name: string
      collected: number
    }>
  }
  transactions?: {
    total: number
    totalAmount: number
    cashAmount: number
    onlineAmount: number
    pending: number
  }
  trends?: {
    monthly: Array<{
      month: number
      year: number
      amount: number
      count: number
    }>
  }
}

export default function TargetDashboard({ userId }: TargetDashboardProps) {
  const [stats, setStats] = useState<TargetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const url = userId
        ? `/api/targets/stats?userId=${userId}`
        : '/api/targets/stats'

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch target stats')
      }

      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error loading target data</span>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!stats || !stats.hasTarget) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <TargetIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Target</h3>
        <p className="text-gray-600">
          You don't have an active fund collection target assigned yet.
        </p>
      </div>
    )
  }

  const { target, hierarchy, transactions, trends } = stats

  return (
    <div className="space-y-6">
      {/* Main Target Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Fund Collection Target</h2>
            {target?.assignedBy && (
              <p className="text-blue-100 text-sm mt-1">
                Assigned by {target.assignedBy.name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatPercentage(target?.completionPercentage || 0)}</div>
            <div className="text-blue-100 text-sm">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-blue-800 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(target?.completionPercentage || 0, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-blue-100 text-sm">Target</div>
            <div className="text-xl font-bold">{formatCurrency(target?.targetAmount || 0)}</div>
          </div>
          <div>
            <div className="text-blue-100 text-sm">Collected</div>
            <div className="text-xl font-bold">{formatCurrency(target?.totalCollected || 0)}</div>
          </div>
          <div>
            <div className="text-blue-100 text-sm">Remaining</div>
            <div className="text-xl font-bold">{formatCurrency(target?.remainingAmount || 0)}</div>
          </div>
          <div>
            <div className="text-blue-100 text-sm">Days Left</div>
            <div className="text-xl font-bold flex items-center">
              <Clock className="w-5 h-5 mr-1" />
              {target?.daysRemaining || 0}
            </div>
          </div>
        </div>

        {target && target.daysRemaining > 0 && target.remainingAmount > 0 && (
          <div className="mt-4 p-3 bg-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-100">Daily Average Needed:</span>
              <span className="text-xl font-bold">{formatCurrency(target.dailyAverageNeeded)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Personal Collection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Personal Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(hierarchy?.personalCollection || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {transactions?.total || 0} transactions
          </div>
        </div>

        {/* Team Collection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Team Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(hierarchy?.teamCollection || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {hierarchy?.subordinatesCount || 0} team members
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Verification</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {transactions?.pending || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Awaiting approval
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          </div>

          {hierarchy && hierarchy.topPerformers && hierarchy.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {hierarchy.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-200 text-gray-600'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(performer.collected)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No team performance data yet</p>
          )}
        </div>

        {/* Team Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Team Breakdown</h3>
          </div>

          {hierarchy && hierarchy.teamBreakdown && hierarchy.teamBreakdown.length > 0 ? (
            <div className="space-y-3">
              {hierarchy.teamBreakdown.map((member) => (
                <div key={member.userId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(member.collected)}</p>
                      <p className="text-xs text-gray-500">{formatPercentage(member.percentage)}</p>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(member.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No team members yet</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {trends && trends.monthly && trends.monthly.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Collection Trend</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trends.monthly.map((month) => (
              <div key={`${month.year}-${month.month}`} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{getMonthName(month.month)}</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(month.amount)}</div>
                <div className="text-xs text-gray-500 mt-1">{month.count} txns</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Details */}
      {target && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">
                {new Date(target.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">
                {new Date(target.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Level</p>
              <p className="font-medium text-gray-900 capitalize">{target.level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium inline-flex items-center ${target.status === 'COMPLETED' ? 'text-green-600' :
                  target.status === 'IN_PROGRESS' ? 'text-blue-600' :
                    'text-gray-600'
                }`}>
                {target.status === 'COMPLETED' && <CheckCircle className="w-4 h-4 mr-1" />}
                {target.status}
              </p>
            </div>
            {target.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900">{target.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
