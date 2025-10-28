'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FilterState {
  category: string
  status: string
  search: string
}

export default function ProgramFilters() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    status: 'all',
    search: ''
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'water', label: 'Clean Water' },
    { value: 'environment', label: 'Environment' },
    { value: 'community', label: 'Community Development' }
  ]

  const statuses = [
    { value: 'all', label: 'All Programs' },
    { value: 'active', label: 'Active' },
    { value: 'funded', label: 'Fully Funded' },
    { value: 'urgent', label: 'Urgent Need' }
  ]

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Here you would typically trigger a search/filter API call
  }

  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      search: ''
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search programs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-auto">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full lg:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-auto">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full lg:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full lg:w-auto"
        >
          Clear Filters
        </Button>
      </div>

      {/* Active Filters Display */}
      {(filters.category !== 'all' || filters.status !== 'all' || filters.search) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>

            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.category !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {categories.find(c => c.value === filters.category)?.label}
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {statuses.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}