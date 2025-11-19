'use client'

import { useEffect, useState } from 'react'
import StatsCard from './StatsCard'
import {
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  Target,
  UserCheck,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalDonations: {
    amount: number
    count: number
    growth: number
  }
  totalUsers: {
    count: number
    active: number
    growth: number
  }
  totalPrograms: {
    count: number
    active: number
    funded: number
  }
  coordinators: {
    count: number
    active: number
    pending: number
  }
  volunteers: {
    total: number
    pending: number
    accepted: number
  }
  recentActivity: {
    donations: number
    registrations: number
    programs: number
    volunteers: number
  }
}

interface RecentDonation {
  id: string
  donorName: string
  amount: number
  program?: string
  createdAt: string
}

interface RecentUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/admin/dashboard/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard statistics')
      }
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch recent donations
      const donationsResponse = await fetch('/api/admin/dashboard/recent-donations?limit=5')
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json()
        setRecentDonations(donationsData.donations || [])
      }

      // Fetch recent users
      const usersResponse = await fetch('/api/admin/dashboard/recent-users?limit=5')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setRecentUsers(usersData.users || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
      year: 'numeric'
    })
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗'
    if (growth < 0) return '↘'
    return '→'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
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
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Donations"
            value={formatCurrency(stats.totalDonations.amount)}
            description={`${stats.totalDonations.count} donations`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            trend={{
              value: stats.totalDonations.growth,
              label: `${getGrowthIcon(stats.totalDonations.growth)} ${Math.abs(stats.totalDonations.growth)}% from last month`
            }}
          />

          <StatsCard
            title="Total Users"
            value={stats.totalUsers.count.toLocaleString()}
            description={`${stats.totalUsers.active} active users`}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            trend={{
              value: stats.totalUsers.growth,
              label: `${getGrowthIcon(stats.totalUsers.growth)} ${Math.abs(stats.totalUsers.growth)}% from last month`
            }}
          />

          <StatsCard
            title="Programs"
            value={stats.totalPrograms.count}
            description={`${stats.totalPrograms.active} active, ${stats.totalPrograms.funded} funded`}
            icon={<FileText className="w-6 h-6 text-purple-600" />}
          />

          <StatsCard
            title="Coordinators"
            value={stats.coordinators.count}
            description={`${stats.coordinators.active} active, ${stats.coordinators.pending} pending`}
            icon={<UserCheck className="w-6 h-6 text-orange-600" />}
          />

          <StatsCard
            title="Volunteer Requests"
            value={stats.volunteers.total}
            description={`${stats.volunteers.pending} pending, ${stats.volunteers.accepted} accepted`}
            icon={<Users className="w-6 h-6 text-pink-600" />}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Donations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.donations}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.registrations}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programs Updated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.programs}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volunteer Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.volunteers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Donations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Donations</h3>
          </div>
          <div className="p-6">
            {recentDonations.length > 0 ? (
              <div className="space-y-4">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{donation.donorName}</p>
                      <p className="text-sm text-gray-500">
                        {donation.program || 'General Fund'} • {formatDate(donation.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(donation.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent donations</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
          </div>
          <div className="p-6">
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.email} • {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'COORDINATOR' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'SUB_COORDINATOR' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {user.role}
                      </span>
                      <p className={`text-xs mt-1 ${user.status === 'ACTIVE' ? 'text-green-600' :
                        user.status === 'PENDING' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                        {user.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}