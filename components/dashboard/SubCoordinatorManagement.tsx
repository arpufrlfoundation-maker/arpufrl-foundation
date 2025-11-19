'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { UserRole, RoleHierarchy, RoleDisplayNames, UserRoleType } from '@/models/User'

interface SubCoordinator {
  id: string
  name: string
  email: string
  phone?: string
  region?: string
  state?: string
  district?: string
  zone?: string
  block?: string
  role: string
  level?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  createdAt?: string
  joinedDate?: string
  referralCode?: string
  referralCodeActive?: boolean
  totalDonations?: number
  totalAmount?: number
  recentDonations?: Array<{
    id: string
    donorName: string
    amount: number
    date: string
  }>
}

interface SubCoordinatorFormData {
  name: string
  email: string
  phone: string
  region: string
  role: string
  password: string
  confirmPassword?: string
}

export default function SubCoordinatorManagement() {
  const { data: session } = useSession()
  const [subordinates, setSubordinates] = useState<SubCoordinator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSubordinate, setSelectedSubordinate] = useState<SubCoordinator | null>(null)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<UserRoleType[]>([])
  const [formData, setFormData] = useState<SubCoordinatorFormData>({
    name: '',
    email: '',
    phone: '',
    region: '',
    role: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (session?.user?.id && session?.user?.role) {
      fetchSubordinates()
      calculateAvailableRoles(session.user.role as UserRoleType)
    }
  }, [session])

  // Calculate which roles can be assigned based on current user's hierarchy level
  const calculateAvailableRoles = (currentRole: UserRoleType) => {
    const currentLevel = RoleHierarchy[currentRole]

    // Get all roles that are one or more levels below current user
    const subordinateRoles = Object.entries(RoleHierarchy)
      .filter(([role, level]) => level > currentLevel && role !== 'ADMIN')
      .map(([role]) => role as UserRoleType)
      .sort((a, b) => RoleHierarchy[a] - RoleHierarchy[b])

    setAvailableRoles(subordinateRoles)

    // Set default role to immediate next level
    if (subordinateRoles.length > 0) {
      setFormData(prev => ({ ...prev, role: subordinateRoles[0] }))
    }
  }

  const fetchSubordinates = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Fetch subordinates using hierarchy system
      const response = await fetch('/api/users/team')

      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      setSubordinates(data.teamMembers || [])
    } catch (error) {
      console.error('Error fetching subordinates:', error)
      setError(error instanceof Error ? error.message : 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubordinate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.id) return

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          confirmPassword: formData.password,
          parentId: session.user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add team member')
      }

      const newSubCoordinator = await response.json()
      // Prepend locally so UI updates immediately. fetchSubordinates will keep data in sync when called elsewhere.
      setSubordinates(prev => [newSubCoordinator, ...prev])
      setShowCreateForm(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        region: '',
        role: '',
        password: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error creating sub-coordinator:', error)
      setError(error instanceof Error ? error.message : 'Failed to create sub-coordinator')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (subCoordinatorId: string, newStatus: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/coordinators/${subCoordinatorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      const updatedSubCoordinator = await response.json()
      setSubordinates(prev =>
        prev.map(sc => sc.id === subCoordinatorId ? { ...sc, status: updatedSubCoordinator.status } : sc)
      )
    } catch (error) {
      console.error('Error updating status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const handleViewDetails = (subCoordinator: SubCoordinator) => {
    setSelectedSubordinate(subCoordinator)
    setShowDetailsModal(true)
  }

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sub-Coordinators and Volunteers</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your sub-coordinators and volunteers in the hierarchy
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Sub-Coordinator
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-red-500">⚠️</div>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Sub-Coordinator</h4>

            <form onSubmit={handleCreateSubordinate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  required
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter region"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role in Hierarchy
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select role...</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {RoleDisplayNames[role]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You can only assign roles below your hierarchy level
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || formData.password !== formData.confirmPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Sub-Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="p-6">
        {subordinates.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              👥
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Team Members Yet</h4>
            <p className="text-gray-600 mb-4">
              Start building your team by adding members to help with fundraising activities.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Team Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subordinates.map((subCoordinator) => (
              <div
                key={subCoordinator.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{subCoordinator.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(subCoordinator.status)}`}>
                        {subCoordinator.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Email:</strong> {subCoordinator.email}</p>
                        {subCoordinator.phone && (
                          <p><strong>Phone:</strong> {subCoordinator.phone}</p>
                        )}
                        {subCoordinator.region && (
                          <p><strong>Region:</strong> {subCoordinator.region}</p>
                        )}
                      </div>

                      {subCoordinator.referralCode && (
                        <div>
                          <p><strong>Referral Code:</strong> {subCoordinator.referralCode}</p>
                          <p><strong>Total Donations:</strong> {subCoordinator.totalDonations || 0}</p>
                          <p><strong>Total Amount:</strong> ₹{(subCoordinator.totalAmount || 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(subCoordinator)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {subCoordinator.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(subCoordinator.id, 'ACTIVE')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}

                    {subCoordinator.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(subCoordinator.id, 'INACTIVE')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Deactivate
                      </button>
                    )}

                    {subCoordinator.status === 'INACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(subCoordinator.id, 'ACTIVE')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSubordinate && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowDetailsModal(false)}
              style={{ zIndex: 9998 }}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative" style={{ zIndex: 9999 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Team Member Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
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
                      <p className="text-sm text-gray-900">{selectedSubordinate.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedSubordinate.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedSubordinate.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Region</label>
                      <p className="text-sm text-gray-900">{selectedSubordinate.region || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900">{RoleDisplayNames[selectedSubordinate.role as UserRoleType]}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedSubordinate.status)}`}>
                        {selectedSubordinate.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                {selectedSubordinate.referralCode && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Referral Performance</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Referral Code</p>
                        <p className="text-lg font-bold text-gray-900 font-mono">{selectedSubordinate.referralCode}</p>
                        {selectedSubordinate.referralCodeActive !== undefined && (
                          <span className={`text-xs ${selectedSubordinate.referralCodeActive ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedSubordinate.referralCodeActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Total Donations</p>
                        <p className="text-lg font-bold text-gray-900">{selectedSubordinate.totalDonations || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Total Amount</p>
                        <p className="text-lg font-bold text-gray-900">₹{(selectedSubordinate.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Donations */}
                {selectedSubordinate.recentDonations && selectedSubordinate.recentDonations.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Recent Donations</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Donor</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedSubordinate.recentDonations.map((donation) => (
                            <tr key={donation.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{donation.donorName}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                ₹{(donation.amount / 100).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(donation.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Location Information */}
                {(selectedSubordinate.state || selectedSubordinate.zone || selectedSubordinate.district || selectedSubordinate.block) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubordinate.state && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State</label>
                          <p className="text-sm text-gray-900">{selectedSubordinate.state}</p>
                        </div>
                      )}
                      {selectedSubordinate.zone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Zone</label>
                          <p className="text-sm text-gray-900">{selectedSubordinate.zone}</p>
                        </div>
                      )}
                      {selectedSubordinate.district && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">District</label>
                          <p className="text-sm text-gray-900">{selectedSubordinate.district}</p>
                        </div>
                      )}
                      {selectedSubordinate.block && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Block</label>
                          <p className="text-sm text-gray-900">{selectedSubordinate.block}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedSubordinate.status === 'ACTIVE' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedSubordinate.id, 'INACTIVE')
                        setShowDetailsModal(false)
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                  {selectedSubordinate.status === 'INACTIVE' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedSubordinate.id, 'ACTIVE')
                        setShowDetailsModal(false)
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Activate
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