'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react'
import DonationTable from './DonationTable'
import StatsCard from './StatsCard'

interface DonationStats {
  totalAmount: number
  totalCount: number
  averageAmount: number
  monthlyGrowth: number
}

interface DonationFilters {
  search: string
  status: string
  program: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

export default function DonationManagement() {
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [filters, setFilters] = useState<DonationFilters>({
    search: '',
    status: '',
    program: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDonationStats()
  }, [])

  const fetchDonationStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/donations/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch donation stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDonationStats()
    setRefreshing(false)
  }

  const handleFilterChange = (key: keyof DonationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      program: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  const exportDonations = async (format: 'csv' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      queryParams.append('format', format)

      const response = await fetch(`/api/admin/donations/export?${queryParams}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `donations-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all donations</p>
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
            onClick={() => exportDonations('csv')}
            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportDonations('pdf')}
            className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Donations"
            value={formatCurrency(stats.totalAmount)}
            description={`${stats.totalCount.toLocaleString()} donations`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
          />
          <StatsCard
            title="Average Donation"
            value={formatCurrency(stats.averageAmount)}
            description="Per donation"
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Monthly Growth"
            value={`${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`}
            description="Compared to last month"
            icon={<Calendar className="w-6 h-6 text-purple-600" />}
            trend={{
              value: stats.monthlyGrowth,
              label: stats.monthlyGrowth > 0 ? 'Increasing' : 'Decreasing'
            }}
          />
          <StatsCard
            title="Total Donors"
            value={stats.totalCount.toLocaleString()}
            description="Unique contributors"
            icon={<Users className="w-6 h-6 text-orange-600" />}
          />
        </div>
      ) : null}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by donor name, email, or transaction ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={filters.program}
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Programs</option>
                  <option value="general">General Fund</option>
                  {/* Programs will be loaded dynamically */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (₹)</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Donation Table */}
      <div className="bg-white rounded-lg shadow">
        <DonationTable filters={filters} />
      </div>
    </div>
  )
}