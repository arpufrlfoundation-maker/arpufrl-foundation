'use client'

import { useState, useEffect } from 'react'
import { Target, Users, Calendar, DollarSign, X, Plus, AlertCircle, CheckCircle, Filter, Search } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  level?: string
  region?: string
  state?: string
  district?: string
}

interface Division {
  assignedToId: string
  name: string
  amount: number
  level: string
  description: string
}

interface TargetAssignmentProps {
  mode: 'assign' | 'divide'
  parentTargetId?: string
  parentTargetAmount?: number
  onSuccess?: () => void
}

const hierarchyLevels = [
  { value: 'national', label: 'National' },
  { value: 'state', label: 'State' },
  { value: 'zone', label: 'Zone' },
  { value: 'district', label: 'District' },
  { value: 'block', label: 'Block' },
  { value: 'nodal', label: 'Nodal' },
  { value: 'prerak', label: 'Prerak (Gram Sabha)' },
  { value: 'prerna', label: 'Prerna Sakhi (Village)' },
  { value: 'volunteer', label: 'Volunteer' }
]

// Priority roles for target assignment
const PRIORITY_ROLES = [
  'STATE_PRESIDENT',
  'STATE_COORDINATOR',
  'ZONE_COORDINATOR'
]

export default function TargetAssignment({ mode, parentTargetId, parentTargetAmount, onSuccess }: TargetAssignmentProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter states
  const [roleFilter, setRoleFilter] = useState<'all' | 'priority'>('priority')
  const [searchTerm, setSearchTerm] = useState('')

  // Single Assignment Form
  const [assignTo, setAssignTo] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState('volunteer')

  // Division Form
  const [divisions, setDivisions] = useState<Division[]>([])
  const [showDivisionForm, setShowDivisionForm] = useState(false)

  useEffect(() => {
    fetchTeamMembers()

    // Set default dates
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    // Filter team members based on role and search
    let filtered = teamMembers

    if (roleFilter === 'priority') {
      filtered = filtered.filter(member => PRIORITY_ROLES.includes(member.role))
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search) ||
        member.region?.toLowerCase().includes(search) ||
        member.state?.toLowerCase().includes(search)
      )
    }

    setFilteredMembers(filtered)
  }, [teamMembers, roleFilter, searchTerm])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users/team')
      if (!response.ok) throw new Error('Failed to fetch team members')

      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (err: any) {
      console.error('Error fetching team members:', err)
    }
  }

  const handleAssignTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/targets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: assignTo,
          targetAmount: parseFloat(targetAmount),
          startDate,
          endDate,
          description,
          level
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign target')
      }

      setSuccess('Target assigned successfully!')

      // Reset form
      setAssignTo('')
      setTargetAmount('')
      setDescription('')

      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDivideTarget = async (e: React.FormEvent) => {
    e.preventDefault()

    if (divisions.length === 0) {
      setError('Please add at least one division')
      return
    }

    const totalDivision = divisions.reduce((sum, div) => sum + div.amount, 0)
    if (parentTargetAmount && totalDivision > parentTargetAmount) {
      setError(`Total division (₹${totalDivision.toLocaleString()}) exceeds parent target (₹${parentTargetAmount.toLocaleString()})`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/targets/divide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentTargetId,
          divisions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to divide target')
      }

      setSuccess(`Target divided successfully among ${divisions.length} members!`)
      setDivisions([])

      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addDivision = () => {
    if (!assignTo || !targetAmount) {
      setError('Please select a member and enter amount')
      return
    }

    const member = teamMembers.find(m => m.id === assignTo)
    if (!member) return

    // Check if already added
    if (divisions.some(d => d.assignedToId === assignTo)) {
      setError('This member is already in the division list')
      return
    }

    setDivisions([...divisions, {
      assignedToId: assignTo,
      name: member.name,
      amount: parseFloat(targetAmount),
      level,
      description: description || `Sub-target for ${member.name}`
    }])

    // Reset fields
    setAssignTo('')
    setTargetAmount('')
    setDescription('')
    setError(null)
  }

  const removeDivision = (index: number) => {
    setDivisions(divisions.filter((_, i) => i !== index))
  }

  const totalDivided = divisions.reduce((sum, div) => sum + div.amount, 0)
  const remaining = parentTargetAmount ? parentTargetAmount - totalDivided : 0

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'STATE_PRESIDENT': 'State President',
      'STATE_COORDINATOR': 'State Coordinator',
      'ZONE_COORDINATOR': 'Zone Coordinator',
      'DISTRICT_PRESIDENT': 'District President',
      'DISTRICT_COORDINATOR': 'District Coordinator',
      'BLOCK_COORDINATOR': 'Block Coordinator',
      'NODAL_OFFICER': 'Nodal Officer',
      'PRERAK': 'Prerak',
      'PRERNA_SAKHI': 'Prerna Sakhi',
      'VOLUNTEER': 'Volunteer'
    }
    return roleNames[role] || role
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Success</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {mode === 'assign' ? (
        // Single Assignment Form
        <form onSubmit={handleAssignTarget} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Assign New Target
            </h3>

            {/* Filter Controls */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRoleFilter('priority')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${roleFilter === 'priority'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                      Priority Roles
                      <span className="ml-2 text-xs">
                        ({teamMembers.filter(m => PRIORITY_ROLES.includes(m.role)).length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('all')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${roleFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                      All Members
                      <span className="ml-2 text-xs">({teamMembers.length})</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, role, region..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {roleFilter === 'priority' && (
                <div className="mt-3 text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded">
                  <strong>Priority Roles:</strong> State President, State Coordinator, Zone Coordinator
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select team member ({filteredMembers.length} available)</option>
                  {filteredMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} • {getRoleDisplayName(member.role)}
                      {member.region && ` • ${member.region}`}
                      {member.state && ` • ${member.state}`}
                    </option>
                  ))}
                </select>
                {filteredMembers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No members found. Try adjusting filters.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min="1"
                  step="1"
                  required
                  placeholder="e.g., 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hierarchy Level *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {hierarchyLevels.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g., Q4 2025 fundraising target for northern region"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Assign Target
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        // Division Form
        <div className="space-y-6">
          {parentTargetAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800 font-medium">Parent Target</p>
                  <p className="text-2xl font-bold text-blue-900">₹{parentTargetAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Remaining to Divide</p>
                  <p className="text-2xl font-bold text-blue-900">₹{remaining.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Already Divided</p>
                  <p className="text-2xl font-bold text-blue-900">₹{totalDivided.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Add Team Members
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Member
                </label>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select team member</option>
                  {filteredMembers.filter(m => !divisions.some(d => d.assignedToId === m.id)).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} • {getRoleDisplayName(member.role)}
                      {member.region && ` • ${member.region}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min="1"
                  step="1"
                  placeholder="e.g., 25000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {hierarchyLevels.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addDivision}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Division List
              </button>
            </div>
          </div>

          {divisions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Division Preview ({divisions.length} members)
              </h3>

              <div className="space-y-3">
                {divisions.map((division, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{division.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{division.level}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900">₹{division.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {parentTargetAmount ? ((division.amount / parentTargetAmount) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <button
                      onClick={() => removeDivision(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <form onSubmit={handleDivideTarget}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Dividing Target...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Divide Target Among {divisions.length} Members
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
