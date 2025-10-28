'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  UserCheck,
  Users,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Target
} from 'lucide-react'
import StatsCard from './StatsCard'

interface Coordinator {
  id: string
  name: string
  email: string
  phone?: string
  role: 'COORDINATOR' | 'SUB_COORDINATOR'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  region: string
  parentCoordinatorId?: string
  parentCoordinatorName?: string
  referralCode?: string
  createdAt: string
  updatedAt: string

  // Performance metrics
  totalDonations: number
  totalAmount: number
  subCoordinatorsCount: number
  monthlyDonations: number
  monthlyAmount: number
}

interface CoordinatorStats {
  totalCoordinators: number
  activeCoordinators: number
  pendingCoordinators: number
  totalSubCoordinators: number
  totalDonationsAttributed: number
  totalAmountAttributed: number
}

interface CoordinatorFilters {
  search: string
  role: string
  status: string
  region: string
}

export default function CoordinatorManagement() {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [stats, setStats] = useState<CoordinatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [filters, setFilters] = useState<CoordinatorFilters>({
    search: '',
    role: '',
    status: '',
    region: ''
  })

  const itemsPerPage = 20

  useEffect(() => {
    fetchCoordinators()
    fetchStats()
  }, [filters, currentPage])

  const fetchCoordinators = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      // Add pagination
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())

      const response = await fetch(`/api/admin/coordinators?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch coordinators')
      }

      const data = await response.json()
      setCoordinators(data.coordinators)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/coordinators/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch coordinator stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchCoordinators(), fetchStats()])
    setRefreshing(false)
  }

  const handleFilterChange = (key: keyof CoordinatorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      region: ''
    })
    setCurrentPage(1)
  }

  const approveCoordinator = async (coordinatorId: string) => {
    try {
      const response = await fetch(`/api/admin/coordinators/${coordinatorId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve coordinator')
      }

      // Refresh the coordinators list
      await fetchCoordinators()
      await fetchStats()
    } catch (error) {
      console.error('Error approving coordinator:', error)
      alert('Failed to approve coordinator')
    }
  }

  const rejectCoordinator = async (coordinatorId: string) => {
    if (!confirm('Are you sure you want to reject this coordinator application?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/coordinators/${coordinatorId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reject coordinator')
      }

      // Refresh the coordinators list
      await fetchCoordinators()
      await fetchStats()
    } catch (error) {
      console.error('Error rejecting coordinator:', error)
      alert('Failed to reject coordinator')
    }
  }

  const updateCoordinatorStatus = async (coordinatorId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/coordinators/${coordinatorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update coordinator status')
      }

      // Refresh the coordinators list
      await fetchCoordinators()
      await fetchStats()
    } catch (error) {
      console.error('Error updating coordinator status:', error)
      alert('Failed to update coordinator status')
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

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      COORDINATOR: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Coordinator' },
      SUB_COORDINATOR: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sub-Coordinator' }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.COORDINATOR

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      INACTIVE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactive' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const viewCoordinatorDetails = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator)
    setShowDetailsModal(true)
  }

  if (loading && !coordinators.length) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordinator Management</h1>
          <p className="text-gray-600 mt-1">Manage coordinators and referral hierarchy</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Coordinators"
            value={stats.totalCoordinators}
            description={`${stats.activeCoordinators} active`}
            icon={<UserCheck className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Sub-Coordinators"
            value={stats.totalSubCoordinators}
            description="Under coordinators"
            icon={<Users className="w-6 h-6 text-purple-600" />}
          />
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingCoordinators}
            description="Awaiting approval"
            icon={<Award className="w-6 h-6 text-yellow-600" />}
          />
          <StatsCard
            title="Total Attributed"
            value={formatCurrency(stats.totalAmountAttributed)}
            description={`${stats.totalDonationsAttributed} donations`}
            icon={<Target className="w-6 h-6 text-green-600" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or referral code..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="SUB_COORDINATOR">Sub-Coordinator</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Coordinators Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Coordinators ({totalCount.toLocaleString()})
            </h3>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coordinators.length > 0 ? (
                coordinators.map((coordinator) => (
                  <tr key={coordinator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {coordinator.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{coordinator.name}</div>
                          <div className="text-sm text-gray-500">{coordinator.email}</div>
                          {coordinator.parentCoordinatorName && (
                            <div className="text-xs text-gray-400">
                              Under: {coordinator.parentCoordinatorName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getRoleBadge(coordinator.role)}
                        {getStatusBadge(coordinator.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coordinator.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{formatCurrency(coordinator.totalAmount)}</div>
                        <div className="text-gray-500">{coordinator.totalDonations} donations</div>
                        {coordinator.subCoordinatorsCount > 0 && (
                          <div className="text-xs text-blue-600">
                            {coordinator.subCoordinatorsCount} sub-coordinators
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {coordinator.referralCode || 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewCoordinatorDetails(coordinator)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {coordinator.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveCoordinator(coordinator.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectCoordinator(coordinator.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {error ? `Error: ${error}` : 'No coordinators found matching your criteria'}
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
      </div>

      {/* Coordinator Details Modal */}
      {showDetailsModal && selectedCoordinator && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)} />

            <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Coordinator Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedCoordinator.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedCoordinator.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedCoordinator.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Region</label>
                      <p className="text-sm text-gray-900">{selectedCoordinator.region}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <div className="mt-1">{getRoleBadge(selectedCoordinator.role)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedCoordinator.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Total Donations</p>
                      <p className="text-lg font-bold text-gray-900">{selectedCoordinator.totalDonations}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedCoordinator.totalAmount)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Sub-Coordinators</p>
                      <p className="text-lg font-bold text-gray-900">{selectedCoordinator.subCoordinatorsCount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Monthly Donations</p>
                      <p className="text-lg font-bold text-gray-900">{selectedCoordinator.monthlyDonations}</p>
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Referral Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                      <p className="text-sm font-mono text-gray-900">{selectedCoordinator.referralCode || 'Not assigned'}</p>
                    </div>
                    {selectedCoordinator.parentCoordinatorName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Coordinator</label>
                        <p className="text-sm text-gray-900">{selectedCoordinator.parentCoordinatorName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedCoordinator.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          approveCoordinator(selectedCoordinator.id)
                          setShowDetailsModal(false)
                        }}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          rejectCoordinator(selectedCoordinator.id)
                          setShowDetailsModal(false)
                        }}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedCoordinator.status !== 'PENDING' && (
                    <button
                      onClick={() => {
                        updateCoordinatorStatus(
                          selectedCoordinator.id,
                          selectedCoordinator.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                        )
                        setShowDetailsModal(false)
                      }}
                      className={`px-4 py-2 text-sm rounded-lg ${selectedCoordinator.status === 'ACTIVE'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {selectedCoordinator.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}