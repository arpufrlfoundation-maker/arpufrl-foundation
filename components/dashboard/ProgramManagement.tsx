'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Star,
  Image as ImageIcon,
  Upload
} from 'lucide-react'
import StatsCard from './StatsCard'
import { CloudinaryService } from '@/lib/cloudinary'

interface Program {
  id: string
  name: string
  slug: string
  description: string
  longDescription?: string
  image?: string
  gallery?: string[]
  targetAmount?: number
  raisedAmount: number
  donationCount: number
  active: boolean
  featured: boolean
  priority: number
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

interface ProgramStats {
  totalPrograms: number
  activePrograms: number
  featuredPrograms: number
  totalTargetAmount: number
  totalRaisedAmount: number
  totalDonations: number
  averageFundingPercentage: number
}

interface ProgramFilters {
  search: string
  status: string
  featured: string
}

export default function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [stats, setStats] = useState<ProgramStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [filters, setFilters] = useState<ProgramFilters>({
    search: '',
    status: '',
    featured: ''
  })

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    longDescription: '',
    targetAmount: '',
    image: '',
    active: true,
    featured: false,
    priority: '0'
  })

  const itemsPerPage = 20

  useEffect(() => {
    fetchPrograms()
    fetchStats()
  }, [filters, currentPage])

  const fetchPrograms = async () => {
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

      const response = await fetch(`/api/admin/programs?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch programs')
      }

      const data = await response.json()
      setPrograms(data.programs)
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
      const response = await fetch('/api/admin/programs/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch program stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPrograms(), fetchStats()])
    setRefreshing(false)
  }

  const handleFilterChange = (key: keyof ProgramFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      featured: ''
    })
    setCurrentPage(1)
  }

  const toggleProgramStatus = async (programId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update program status')
      }

      // Refresh the programs list
      await fetchPrograms()
      await fetchStats()
    } catch (error) {
      console.error('Error updating program status:', error)
      alert('Failed to update program status')
    }
  }

  const toggleProgramFeatured = async (programId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      })

      if (!response.ok) {
        throw new Error('Failed to update program featured status')
      }

      // Refresh the programs list
      await fetchPrograms()
      await fetchStats()
    } catch (error) {
      console.error('Error updating program featured status:', error)
      alert('Failed to update program featured status')
    }
  }

  const deleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete program')
      }

      // Refresh the programs list
      await fetchPrograms()
      await fetchStats()
    } catch (error) {
      console.error('Error deleting program:', error)
      alert('Failed to delete program')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      const result = await CloudinaryService.uploadProgramImage(file)
      if (result.success && result.url) {
        setCreateForm(prev => ({ ...prev, image: result.url || '' }))
      } else {
        setError(result.error || 'Failed to upload image')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          targetAmount: createForm.targetAmount ? parseFloat(createForm.targetAmount) : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create program')
      }

      // Reset form and close modal
      setCreateForm({
        name: '',
        description: '',
        longDescription: '',
        targetAmount: '',
        image: '',
        active: true,
        featured: false,
        priority: '0'
      })
      setShowCreateModal(false)

      // Refresh the programs list
      await fetchPrograms()
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program')
    } finally {
      setCreating(false)
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

  const getFundingPercentage = (raised: number, target?: number) => {
    if (!target || target === 0) return 0
    return Math.min((raised / target) * 100, 100)
  }

  const getStatusBadge = (active: boolean) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${active
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
        }`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    )
  }

  const viewProgramDetails = (program: Program) => {
    setSelectedProgram(program)
    setShowDetailsModal(true)
  }

  const editProgram = (program: Program) => {
    setSelectedProgram(program)
    setShowEditModal(true)
  }

  if (loading && !programs.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Program Management</h1>
          <p className="text-gray-600 mt-1">Manage programs and track funding progress</p>
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Programs"
            value={stats.totalPrograms}
            description={`${stats.activePrograms} active`}
            icon={<Target className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Featured Programs"
            value={stats.featuredPrograms}
            description="Highlighted programs"
            icon={<Star className="w-6 h-6 text-yellow-600" />}
          />
          <StatsCard
            title="Total Raised"
            value={formatCurrency(stats.totalRaisedAmount)}
            description={`Target: ${formatCurrency(stats.totalTargetAmount)}`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
          />
          <StatsCard
            title="Total Donations"
            value={stats.totalDonations.toLocaleString()}
            description={`${stats.averageFundingPercentage.toFixed(1)}% avg funding`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by program name or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Programs</option>
              <option value="featured">Featured Only</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>
        </div>

        {(filters.search || filters.status || filters.featured) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Programs ({totalCount.toLocaleString()})
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
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funding Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.length > 0 ? (
                programs.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {program.image ? (
                            <img
                              src={program.image}
                              alt={program.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {program.name}
                            {program.featured && (
                              <Star className="w-4 h-4 ml-2 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {program.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(program.active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {formatCurrency(program.raisedAmount)}
                          {program.targetAmount && (
                            <span className="text-gray-500">
                              {' / '}{formatCurrency(program.targetAmount)}
                            </span>
                          )}
                        </div>
                        {program.targetAmount && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${getFundingPercentage(program.raisedAmount, program.targetAmount)}%`
                              }}
                            />
                          </div>
                        )}
                        {program.targetAmount && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getFundingPercentage(program.raisedAmount, program.targetAmount).toFixed(1)}% funded
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{program.donationCount}</div>
                      <div className="text-gray-500">donations</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(program.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => viewProgramDetails(program)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editProgram(program)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Program"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleProgramStatus(program.id, program.active)}
                          className={program.active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                          title={program.active ? "Deactivate" : "Activate"}
                        >
                          {program.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleProgramFeatured(program.id, program.featured)}
                          className={program.featured ? "text-yellow-600 hover:text-yellow-900" : "text-gray-600 hover:text-gray-900"}
                          title={program.featured ? "Remove from Featured" : "Add to Featured"}
                        >
                          <Star className={`w-4 h-4 ${program.featured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => deleteProgram(program.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {error ? `Error: ${error}` : 'No programs found matching your criteria'}
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

      {/* Program Details Modal */}
      {showDetailsModal && selectedProgram && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)} />

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Program Details</h3>
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
                      <p className="text-sm text-gray-900">{selectedProgram.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slug</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedProgram.slug}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedProgram.description}</p>
                    </div>
                    {selectedProgram.longDescription && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Long Description</label>
                        <p className="text-sm text-gray-900">{selectedProgram.longDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Funding Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Funding Information</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Target Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedProgram.targetAmount ? formatCurrency(selectedProgram.targetAmount) : 'No target'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Raised Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedProgram.raisedAmount)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Donations</p>
                      <p className="text-lg font-bold text-gray-900">{selectedProgram.donationCount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Progress</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedProgram.targetAmount
                          ? `${getFundingPercentage(selectedProgram.raisedAmount, selectedProgram.targetAmount).toFixed(1)}%`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Status & Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedProgram.active)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Featured</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedProgram.featured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedProgram.featured ? 'Featured' : 'Not Featured'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <p className="text-sm text-gray-900">{selectedProgram.priority}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedProgram.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* SEO Information */}
                {(selectedProgram.metaTitle || selectedProgram.metaDescription) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">SEO Information</h4>
                    <div className="space-y-3">
                      {selectedProgram.metaTitle && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                          <p className="text-sm text-gray-900">{selectedProgram.metaTitle}</p>
                        </div>
                      )}
                      {selectedProgram.metaDescription && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                          <p className="text-sm text-gray-900">{selectedProgram.metaDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      editProgram(selectedProgram)
                      setShowDetailsModal(false)
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Program
                  </button>
                  <button
                    onClick={() => {
                      toggleProgramStatus(selectedProgram.id, selectedProgram.active)
                      setShowDetailsModal(false)
                    }}
                    className={`px-4 py-2 text-sm rounded-lg ${selectedProgram.active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {selectedProgram.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      toggleProgramFeatured(selectedProgram.id, selectedProgram.featured)
                      setShowDetailsModal(false)
                    }}
                    className={`px-4 py-2 text-sm rounded-lg ${selectedProgram.featured
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                  >
                    {selectedProgram.featured ? 'Remove Featured' : 'Make Featured'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowCreateModal(false)}
              style={{ zIndex: 9998 }}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative" style={{ zIndex: 9999 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Program</h3>
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

              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter program name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description (10-500 characters)"
                      minLength={10}
                      maxLength={500}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long Description
                    </label>
                    <textarea
                      rows={4}
                      value={createForm.longDescription}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, longDescription: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed description (optional, 50-5000 characters)"
                      maxLength={5000}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={createForm.targetAmount}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional target amount"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={createForm.priority}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Display priority (0 = highest)"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Image
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {uploadingImage && (
                        <div className="flex items-center text-sm text-blue-600">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading image...
                        </div>
                      )}
                      {createForm.image && !uploadingImage && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1">Preview:</p>
                          <img
                            src={createForm.image}
                            alt="Program preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.active}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, active: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.featured}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, featured: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
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
                    {creating ? 'Creating...' : 'Create Program'}
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