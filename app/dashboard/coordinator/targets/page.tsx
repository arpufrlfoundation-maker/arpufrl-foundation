'use client'

import { useState, useEffect } from 'react'
import CoordinatorDashboardLayout from '@/components/dashboard/CoordinatorDashboardLayout'
import TargetDashboard from '@/components/dashboard/TargetDashboard'
import TargetAssignment from '@/components/dashboard/TargetAssignment'
import TransactionRecording from '@/components/dashboard/TransactionRecording'
import { Target, Split, DollarSign, BarChart } from 'lucide-react'

export default function CoordinatorTargetsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'divide' | 'record' | 'ranking'>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [parentTargetId, setParentTargetId] = useState<string | undefined>()
  const [parentTargetAmount, setParentTargetAmount] = useState<number | undefined>()
  const [loadingTarget, setLoadingTarget] = useState(false)

  useEffect(() => {
    fetchActiveTarget()
  }, [refreshKey])

  const fetchActiveTarget = async () => {
    try {
      setLoadingTarget(true)
      const response = await fetch('/api/targets?status=IN_PROGRESS')
      const data = await response.json()

      if (response.ok && data.targets && data.targets.length > 0) {
        const activeTarget = data.targets[0]
        setParentTargetId(activeTarget._id || activeTarget.id)
        setParentTargetAmount(activeTarget.targetValue)
      }
    } catch (error) {
      console.error('Error fetching active target:', error)
    } finally {
      setLoadingTarget(false)
    }
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <CoordinatorDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fund Collection Targets</h1>
            <p className="text-gray-600 mt-1">
              Track your target progress and manage team performance
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'dashboard'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Target className="w-5 h-5 mr-2" />
              My Dashboard
            </button>
            <button
              onClick={() => setActiveTab('divide')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'divide'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Split className="w-5 h-5 mr-2" />
              Divide Target
            </button>
            <button
              onClick={() => setActiveTab('record')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'record'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Record Collection
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'ranking'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <BarChart className="w-5 h-5 mr-2" />
              Hierarchy Ranking
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <TargetDashboard key={refreshKey} />
        )}

        {activeTab === 'divide' && (
          <div className="bg-white rounded-lg shadow p-6">
            {loadingTarget ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : !parentTargetId ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Target className="w-16 h-16 mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Active Target</p>
                <p className="text-sm">You need an active target to divide it among your team</p>
              </div>
            ) : (
              <TargetAssignment
                mode="divide"
                parentTargetId={parentTargetId}
                parentTargetAmount={parentTargetAmount}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div className="bg-white rounded-lg shadow p-6">
            <TransactionRecording onSuccess={handleSuccess} />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow p-6">
            <HierarchyRanking />
          </div>
        )}
      </div>
    </CoordinatorDashboardLayout>
  )
}

function HierarchyRanking() {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  const fetchRanking = async () => {
    try {
      setLoading(true)
      // Fetch hierarchy-based ranking (all users in same hierarchy level)
      const response = await fetch('/api/targets/hierarchy-ranking')
      const data = await response.json()

      if (response.ok) {
        setRanking(data.ranking || [])
        setCurrentUserRank(data.currentUserRank || null)
      }
    } catch (error) {
      console.error('Error fetching ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <BarChart className="w-6 h-6 mr-2 text-green-600" />
          Hierarchy Ranking
        </h2>
        <p className="text-gray-600 mt-1">
          Your ranking among peers in the hierarchy
          {currentUserRank && ` - You are ranked #${currentUserRank}`}
        </p>
      </div>

      {ranking.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No ranking data available yet</p>
      ) : (
        <div className="space-y-3">
          {ranking.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg ${entry.isCurrentUser
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
                : index < 3
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                  : 'bg-gray-50'
                }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${entry.isCurrentUser
                    ? 'bg-blue-500 text-white'
                    : index === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                          ? 'bg-orange-300 text-orange-900'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  #{entry.rank}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {entry.name} {entry.isCurrentUser && '(You)'}
                  </p>
                  <p className="text-sm text-gray-600">{entry.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ₹{(entry.totalCollected || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">
                  {(entry.achievementPercentage || 0).toFixed(1)}% achieved
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}