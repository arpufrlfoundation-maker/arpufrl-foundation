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
  role: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  createdAt: string
  referralCode?: {
    id: string
    code: string
    totalDonations: number
    totalAmount: number
  }
}

interface SubCoordinatorFormData {
  name: string
  email: string
  phone: string
  region: string
  role: string
  password: string
}

export default function SubCoordinatorManagement() {
  const { data: session } = useSession()
  const [subordinates, setSubordinates] = useState<SubCoordinator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<UserRoleType[]>([])
  const [formData, setFormData] = useState<SubCoordinatorFormData>({
    name: '',
    email: '',
    phone: '',
    region: '',
    role: '',
    password: ''
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
        password: ''
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

  const getStatusBadgeColor = (status: string) => {
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
                    value={formData.password}
                    onChange={(e) => {
                      // This validates password match on the fly
                      if (formData.password !== e.target.value) {
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
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                          <p><strong>Referral Code:</strong> {subCoordinator.referralCode.code}</p>
                          <p><strong>Total Donations:</strong> {subCoordinator.referralCode.totalDonations}</p>
                          <p><strong>Total Amount:</strong> ₹{subCoordinator.referralCode.totalAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
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
    </div>
  )
}