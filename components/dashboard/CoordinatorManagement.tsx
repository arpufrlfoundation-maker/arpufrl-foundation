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
  EyeOff,
  CheckCircle,
  XCircle,
  Award,
  Target,
  UserPlus
} from 'lucide-react'
import StatsCard from './StatsCard'
import { UserRole, RoleHierarchy, RoleDisplayNames, UserRoleType } from '@/models/User'

interface Coordinator {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRoleType
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
  subordinatesCount: number
  monthlyDonations: number
  monthlyAmount: number
}

interface CreateCoordinatorForm {
  name: string
  email: string
  phone: string
  role: UserRoleType | ''
  region: string
  password: string
  parentCoordinatorId?: string
}

interface CoordinatorStats {
  totalCoordinators: number
  activeCoordinators: number
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [parentCoordinators, setParentCoordinators] = useState<{ id: string; name: string; role: string }[]>([])

  const [createForm, setCreateForm] = useState<CreateCoordinatorForm>({
    name: '',
    email: '',
    phone: '',
    role: '',
    region: '',
    password: '',
    parentCoordinatorId: ''
  })

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
    fetchParentCoordinators()
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch coordinators' }))
        throw new Error(errorData.error || 'Failed to fetch coordinators')
      }

      const data = await response.json()
      setCoordinators(data.coordinators || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.totalCount || 0)

    } catch (err) {
      console.error('Error fetching coordinators:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching coordinators')
      setCoordinators([]) // Set empty array on error
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

  const fetchParentCoordinators = async () => {
    try {
      const response = await fetch('/api/admin/coordinators?status=ACTIVE&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setParentCoordinators(data.coordinators.map((c: Coordinator) => ({
          id: c.id,
          name: c.name,
          role: c.role
        })))
      }
    } catch (error) {
      console.error('Failed to fetch parent coordinators:', error)
    }
  }

  const handleCreateCoordinator = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          confirmPassword: createForm.password,
          parentId: createForm.parentCoordinatorId || undefined,
          status: 'ACTIVE' // Admin-created coordinators are active by default
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create coordinator')
      }

      await fetchCoordinators()
      await fetchStats()
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        region: '',
        password: '',
        parentCoordinatorId: ''
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create coordinator')
    } finally {
      setCreating(false)
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

  const handleViewDetails = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator)
    setShowDetailsModal(true)
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

  const getRoleBadge = (role: UserRoleType) => {
    const roleLevel = RoleHierarchy[role]
    const colors = [
      { bg: 'bg-red-100', text: 'text-red-800' },      // Admin
      { bg: 'bg-purple-100', text: 'text-purple-800' }, // Central President
      { bg: 'bg-blue-100', text: 'text-blue-800' },     // State President
      { bg: 'bg-indigo-100', text: 'text-indigo-800' }, // State Coordinator
      { bg: 'bg-cyan-100', text: 'text-cyan-800' },     // Zone Coordinator
      { bg: 'bg-teal-100', text: 'text-teal-800' },     // District President
      { bg: 'bg-green-100', text: 'text-green-800' },   // District Coordinator
      { bg: 'bg-lime-100', text: 'text-lime-800' },     // Block Coordinator
      { bg: 'bg-yellow-100', text: 'text-yellow-800' }, // Nodal Officer
      { bg: 'bg-orange-100', text: 'text-orange-800' }, // Prerak
      { bg: 'bg-pink-100', text: 'text-pink-800' },     // Prerna Sakhi
      { bg: 'bg-gray-100', text: 'text-gray-800' }      // Volunteer
    ]

    const color = colors[roleLevel] || colors[11]

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color.bg} ${color.text}`}>
        {RoleDisplayNames[role]}
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
      {/* Error Alert - Show prominently if there's an error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Coordinators</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    fetchCoordinators()
                  }}
                  className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your sub-coordinators and volunteers</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Sub-Coordinator
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalCoordinators}
            description={`${stats.activeCoordinators} active users in hierarchy`}
            icon={<UserCheck className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Active Members"
            value={stats.activeCoordinators}
            description="All active team members"
            icon={<Users className="w-6 h-6 text-green-600" />}
          />
          <StatsCard
            title="Total Attributed"
            value={formatCurrency(stats.totalAmountAttributed)}
            description={`${stats.totalDonationsAttributed} donations`}
            icon={<Target className="w-6 h-6 text-purple-600" />}
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
              {Object.entries(UserRole).map(([key, value]) => (
                <option key={value} value={value}>
                  {RoleDisplayNames[value as UserRoleType]}
                </option>
              ))}
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
                        {coordinator.subordinatesCount > 0 && (
                          <div className="text-xs text-blue-600">
                            {coordinator.subordinatesCount} subordinates
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
                          onClick={() => handleViewDetails(coordinator)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowDetailsModal(false)}
              style={{ zIndex: 9998 }}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative z-[101]" style={{ zIndex: 9999 }}>
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
                      <p className="text-sm font-medium text-gray-700">Subordinates</p>
                      <p className="text-lg font-bold text-gray-900">{selectedCoordinator.subordinatesCount}</p>
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
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Close
                  </button>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Coordinator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowCreateModal(false)}
              style={{ zIndex: 9998 }}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative z-[101]" style={{ zIndex: 9999 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Team Member</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateCoordinator} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role in Hierarchy *
                    </label>
                    <select
                      required
                      value={createForm.role}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as UserRoleType }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select role...</option>
                      {Object.entries(UserRole)
                        .filter(([key]) => key !== 'ADMIN' && key !== 'VOLUNTEER')
                        .sort(([, a], [, b]) => RoleHierarchy[a as UserRoleType] - RoleHierarchy[b as UserRoleType])
                        .map(([key, value]) => (
                          <option key={value} value={value}>
                            {RoleDisplayNames[value as UserRoleType]}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.region}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter region"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Coordinator (Optional)
                    </label>
                    <select
                      value={createForm.parentCoordinatorId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, parentCoordinatorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={createForm.role === 'STATE_PRESIDENT' || createForm.role === 'STATE_COORDINATOR'}
                    >
                      <option value="">None (Top-level)</option>
                      {parentCoordinators
                        .filter(pc => {
                          if (!createForm.role) return true
                          return RoleHierarchy[pc.role as UserRoleType] < RoleHierarchy[createForm.role as UserRoleType]
                        })
                        .map(pc => (
                          <option key={pc.id} value={pc.id}>
                            {pc.name} ({RoleDisplayNames[pc.role as UserRoleType]})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {(createForm.role === 'STATE_PRESIDENT' || createForm.role === 'STATE_COORDINATOR')
                        ? '✓ Will automatically be assigned under ADMIN'
                        : 'Parent must be higher in hierarchy than selected role'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={createForm.password}
                        onChange={(e) => {
                          // This validates password match on the fly
                          if (createForm.password !== e.target.value) {
                            e.target.setCustomValidity('Passwords do not match')
                          } else {
                            e.target.setCustomValidity('')
                          }
                        }}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Team Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}