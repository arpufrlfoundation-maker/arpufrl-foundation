'use client'

import { useState } from 'react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import TargetDashboard from '@/components/dashboard/TargetDashboard'
import TargetAssignment from '@/components/dashboard/TargetAssignment'
import { Target, Plus, BarChart, Users } from 'lucide-react'

export default function AdminTargetsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assign' | 'leaderboard'>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAssignmentSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fund Collection Targets</h1>
            <p className="text-gray-600 mt-1">
              Manage and track hierarchical fund collection targets across your organization
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-6 py-3 font-medium transition-colors ${activeTab === 'dashboard'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Target className="w-5 h-5 mr-2" />
              My Dashboard
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`flex items-center px-6 py-3 font-medium transition-colors ${activeTab === 'assign'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Assign Target
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center px-6 py-3 font-medium transition-colors ${activeTab === 'leaderboard'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <BarChart className="w-5 h-5 mr-2" />
              Leaderboard
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <TargetDashboard key={refreshKey} />
        )}

        {activeTab === 'assign' && (
          <div className="bg-white rounded-lg shadow p-6">
            <TargetAssignment mode="assign" onSuccess={handleAssignmentSuccess} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow p-6">
            <LeaderboardView />
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
}

function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('national')

  useState(() => {
    fetchLeaderboard()
  })

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/targets/leaderboard?scope=${scope}&limit=20`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Performance Leaderboard
        </h2>
        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value)
            fetchLeaderboard()
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="national">National</option>
          <option value="team">My Team</option>
        </select>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No leaderboard data available yet</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50'
                }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                  }`}>
                  #{entry.rank}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{entry.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{entry.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ₹{entry.totalCollected.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {entry.achievementPercentage.toFixed(1)}% achieved
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
