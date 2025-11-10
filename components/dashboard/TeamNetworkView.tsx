/**
 * Team Network View Component
 * Displays team members and organizational structure
 */

'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, ChevronRight, Mail, MapPin, Calendar } from 'lucide-react'

interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  status: string
  region?: string
  state?: string
  zone?: string
  district?: string
  totalDonationsReferred?: number
  totalAmountReferred?: number
  referralCode?: string
  createdAt: string
}

interface TeamNetworkViewProps {
  userId: string
  className?: string
}

export function TeamNetworkView({ userId, className = '' }: TeamNetworkViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')

  useEffect(() => {
    fetchTeamMembers()
  }, [page, filterRole, filterStatus])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterRole && { role: filterRole }),
        ...(filterStatus && { status: filterStatus })
      })

      const response = await fetch(`/api/dashboard/team?${params}`)
      const data = await response.json()

      if (data.success) {
        setMembers(data.data.members)
        setTotalPages(data.data.pagination.pages)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      CENTRAL_PRESIDENT: 'bg-purple-100 text-purple-800',
      STATE_PRESIDENT: 'bg-blue-100 text-blue-800',
      STATE_COORDINATOR: 'bg-indigo-100 text-indigo-800',
      ZONE_COORDINATOR: 'bg-cyan-100 text-cyan-800',
      DISTRICT_PRESIDENT: 'bg-green-100 text-green-800',
      DISTRICT_COORDINATOR: 'bg-emerald-100 text-emerald-800',
      BLOCK_COORDINATOR: 'bg-teal-100 text-teal-800',
      NODAL_OFFICER: 'bg-lime-100 text-lime-800',
      PRERAK: 'bg-yellow-100 text-yellow-800',
      PRERNA_SAKHI: 'bg-orange-100 text-orange-800',
      VOLUNTEER: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">My Team</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-600'
              }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'tree' ? 'bg-green-100 text-green-700' : 'text-gray-600'
              }`}
          >
            Tree
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Roles</option>
          <option value="STATE_PRESIDENT">State President</option>
          <option value="ZONE_COORDINATOR">Zone Coordinator</option>
          <option value="DISTRICT_PRESIDENT">District President</option>
          <option value="BLOCK_COORDINATOR">Block Coordinator</option>
          <option value="PRERAK">Prerak</option>
          <option value="PRERNA_SAKHI">Prerna Sakhi</option>
          <option value="VOLUNTEER">Volunteer</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading team members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team members found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(member.role)}`}>
                      {member.role.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(member.status)}`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {member.email}
                    </div>
                    {member.region && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {member.region}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {(member.totalDonationsReferred || member.totalAmountReferred) && (
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-green-600 font-medium">
                        {member.totalDonationsReferred || 0} donations
                      </span>
                      <span className="text-green-700 font-semibold">
                        ₹{(member.totalAmountReferred || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
