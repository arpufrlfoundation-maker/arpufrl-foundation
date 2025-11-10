'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Clock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  UserCheck,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface PendingUser {
  _id: string
  name: string
  email: string
  phone: string
  fatherPhone?: string
  motherPhone?: string
  role: string
  region: string
  status: string
  createdAt: string
  parentCoordinatorId?: string
  parentCoordinatorName?: string
  referralCode?: string
}

export default function UserApprovalDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch pending users
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingUsers()
    }
  }, [status])

  // Filter users based on search and role
  useEffect(() => {
    // First filter out non-pending users
    let filtered = pendingUsers.filter(user => user.status === 'PENDING')

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, pendingUsers])

  const fetchPendingUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users/pending')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending users')
      }

      setPendingUsers(data.users || [])
      setFilteredUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this user?')) return

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve user')
      }

      // Remove the approved user from the list immediately
      setPendingUsers(prev => prev.filter(u => u._id !== userId))
      setFilteredUsers(prev => prev.filter(u => u._id !== userId))
      setShowDetailsModal(false)

      // Show success message
      alert(`✅ User approved successfully! ${data.user?.name || 'User'} can now log in.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will set their status to INACTIVE.')) return

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject user')
      }

      // Remove the rejected user from the list immediately
      setPendingUsers(prev => prev.filter(u => u._id !== userId))
      setFilteredUsers(prev => prev.filter(u => u._id !== userId))
      setShowDetailsModal(false)

      // Show success message
      alert(`❌ User rejected. ${data.user?.name || 'User'} has been set to INACTIVE status.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject user')
    } finally {
      setActionLoading(null)
    }
  }

  const viewUserDetails = (user: PendingUser) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Approval Dashboard</h1>
              <p className="text-gray-600">Review and approve pending user registrations</p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
            </div>
            <Filter className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="CENTRAL_PRESIDENT">Central President</option>
            <option value="STATE_PRESIDENT">State President</option>
            <option value="STATE_COORDINATOR">State Coordinator</option>
            <option value="ZONE_COORDINATOR">Zone Coordinator</option>
            <option value="DISTRICT_PRESIDENT">District President</option>
            <option value="DISTRICT_COORDINATOR">District Coordinator</option>
            <option value="BLOCK_COORDINATOR">Block Coordinator</option>
            <option value="NODAL_OFFICER">Nodal Officer</option>
            <option value="PRERAK">Prerak</option>
            <option value="PRERNA_SAKHI">Prerna Sakhi</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredUsers.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Users</h3>
          <p className="text-gray-600">
            {searchQuery || roleFilter !== 'ALL'
              ? 'No users match your search criteria'
              : 'There are no pending user registrations at the moment'}
          </p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && filteredUsers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleApprove(user._id)}
                        disabled={actionLoading === user._id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === user._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user._id)}
                        disabled={actionLoading === user._id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">{selectedUser.role.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Region</p>
                    <p className="font-medium text-gray-900">{selectedUser.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contacts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Father's Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.fatherPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mother's Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.motherPhone || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These contacts are confidential and used only for emergency verification
                </p>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedUser.referralCode && (
                    <div>
                      <p className="text-sm text-gray-600">Referral Code</p>
                      <p className="font-medium text-gray-900">{selectedUser.referralCode}</p>
                    </div>
                  )}
                  {selectedUser.parentCoordinatorName && (
                    <div>
                      <p className="text-sm text-gray-600">Parent Coordinator</p>
                      <p className="font-medium text-gray-900">{selectedUser.parentCoordinatorName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleReject(selectedUser._id)}
                disabled={actionLoading === selectedUser._id}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === selectedUser._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject User
              </button>
              <button
                onClick={() => handleApprove(selectedUser._id)}
                disabled={actionLoading === selectedUser._id}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === selectedUser._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
