'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import TargetDashboard from '@/components/dashboard/TargetDashboard'
import TargetAssignment from '@/components/dashboard/TargetAssignment'
import { Target, Plus, BarChart, Users } from 'lucide-react'

export default function AdminTargetsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'assign' | 'leaderboard'>('overview')
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
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Assigned Targets
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'dashboard'
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
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <AssignedTargetsOverview key={refreshKey} />
          </div>
        )}

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

function AssignedTargetsOverview() {
  const [targets, setTargets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAssignedTargets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/targets/assign')
      const data = await response.json()

      if (response.ok) {
        setTargets(data.targets || [])
      }
    } catch (error) {
      console.error('Error fetching assigned targets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedTargets()
  }, [])

  const formatCurrency = (amount: number) => {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Filter targets
  const filteredTargets = targets.filter(target => {
    const statusMatch = filterStatus === 'all' || target.status === filterStatus
    const searchMatch = !searchTerm ||
      target.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.assignedTo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.level?.toLowerCase().includes(searchTerm.toLowerCase())
    return statusMatch && searchMatch
  })

  // Calculate stats
  const stats = {
    total: targets.length,
    pending: targets.filter(t => t.status === 'PENDING').length,
    inProgress: targets.filter(t => t.status === 'IN_PROGRESS').length,
    completed: targets.filter(t => t.status === 'COMPLETED').length,
    totalTarget: targets.reduce((sum, t) => sum + (t.targetAmount || 0), 0),
    totalCollected: targets.reduce((sum, t) => sum + (t.totalCollected || 0), 0)
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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Assigned Targets</h2>
        <p className="text-gray-600">Track targets assigned to coordinators and their completion status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">Total Targets</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-800">In Progress</p>
          <p className="text-2xl font-bold text-purple-900">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Overall Collection Progress</h3>
          <span className="text-2xl font-bold text-blue-600">
            {stats.totalTarget > 0 ? Math.round((stats.totalCollected / stats.totalTarget) * 100) : 0}%
          </span>
        </div>
        <div className="bg-blue-200 rounded-full h-4 mb-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.totalTarget > 0 ? Math.min((stats.totalCollected / stats.totalTarget) * 100, 100) : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>Collected: {formatCurrency(stats.totalCollected)}</span>
          <span>Target: {formatCurrency(stats.totalTarget)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or level..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Targets Table */}
      {filteredTargets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No targets found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {target.assignedTo?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {target.assignedTo?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {target.level || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(target.targetAmount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(target.totalCollected || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2" style={{ width: '100px' }}>
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${target.completionPercentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {target.completionPercentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(target.startDate)}</div>
                      <div className="text-xs">to {formatDate(target.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(target.status)}`}>
                        {target.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('national')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/targets/leaderboard?scope=${scope}&limit=100`)
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

  useEffect(() => {
    fetchLeaderboard()
  }, [scope])

  // Filter by level
  const filteredLeaderboard = levelFilter === 'all'
    ? leaderboard
    : leaderboard.filter(entry => entry.level === levelFilter)

  // Get unique levels for filter
  const availableLevels = [...new Set(leaderboard.map(entry => entry.level))].sort()

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
        <div className="flex gap-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            {availableLevels.map(level => (
              <option key={level} value={level} className="capitalize">{level}</option>
            ))}
          </select>
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
      </div>

      {filteredLeaderboard.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No data available for selected filters</p>
      ) : (
        <div className="space-y-3">
          {filteredLeaderboard.map((entry, index) => (
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
