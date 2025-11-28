'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Hospital,
  School,
  Heart,
  Users,
  UserCheck,
  Eye,
  CheckCircle,
  Archive,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download
} from 'lucide-react'
import StatsCard from './StatsCard'

interface Survey {
  _id: string
  surveyType: string
  status: string
  location: string
  district: string
  state: string
  surveyorName: string
  surveyorContact: string
  surveyDate: string
  data: any
  submittedBy?: {
    name: string
    email: string
  }
  reviewedBy?: {
    name: string
    email: string
  }
  reviewedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface SurveyStats {
  totalSurveys: number
  byType: {
    hospital: number
    school: number
    healthCamp: number
    communityWelfare: number
    staffVolunteer: number
  }
  byStatus: {
    submitted: number
    reviewed: number
  }
  recentSurveys: Survey[]
}

const surveyTypeLabels: Record<string, string> = {
  HOSPITAL: 'Hospital Survey / अस्पताल सर्वेक्षण',
  SCHOOL: 'School Survey / विद्यालय सर्वेक्षण',
  HEALTH_CAMP: 'Health Camp Feedback / स्वास्थ्य शिविर प्रतिक्रिया',
  COMMUNITY_WELFARE: 'Community Welfare Report / सामुदायिक कल्याण रिपोर्ट',
  STAFF_VOLUNTEER: 'Staff & Volunteer Feedback / कर्मचारी और स्वयंसेवक प्रतिक्रिया',
  BUSINESS: 'Business Survey / व्यवसाय सर्वेक्षण',
  CITIZEN: 'Citizen Survey / नागरिक सर्वेक्षण',
  POLITICAL_ANALYSIS: 'Political Analysis Survey / राजनीतिक विश्लेषण सर्वेक्षण'
}

const surveyTypeEmoji: Record<string, string> = {
  HOSPITAL: '🏥',
  SCHOOL: '🏫',
  HEALTH_CAMP: '⛑️',
  COMMUNITY_WELFARE: '🤝',
  STAFF_VOLUNTEER: '👥',
  BUSINESS: '💼',
  CITIZEN: '👤',
  POLITICAL_ANALYSIS: '🗳️'
}

const surveyTypeIcons: Record<string, any> = {
  HOSPITAL: Hospital,
  SCHOOL: School,
  HEALTH_CAMP: Heart,
  COMMUNITY_WELFARE: Users,
  STAFF_VOLUNTEER: UserCheck,
  BUSINESS: FileText,
  CITIZEN: Users,
  POLITICAL_ANALYSIS: FileText
}

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  })

  const itemsPerPage = 20

  useEffect(() => {
    fetchSurveys()
    fetchStats()
  }, [filters, currentPage])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())

      const response = await fetch(`/api/surveys?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch surveys')
      }

      const data = await response.json()
      setSurveys(data.surveys || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.totalCount || 0)
    } catch (err) {
      console.error('Error fetching surveys:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSurveys([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/surveys/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch survey stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchSurveys(), fetchStats()])
    setRefreshing(false)
  }

  const handleUpdateStatus = async (surveyId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })

      if (!response.ok) {
        throw new Error('Failed to update survey')
      }

      await fetchSurveys()
      await fetchStats()
    } catch (error) {
      console.error('Error updating survey:', error)
      alert('Failed to update survey')
    }
  }

  const getSurveyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      HOSPITAL: 'bg-red-100 text-red-800',
      SCHOOL: 'bg-blue-100 text-blue-800',
      HEALTH_CAMP: 'bg-green-100 text-green-800',
      COMMUNITY_WELFARE: 'bg-purple-100 text-purple-800',
      STAFF_VOLUNTEER: 'bg-orange-100 text-orange-800',
      BUSINESS: 'bg-yellow-100 text-yellow-800',
      CITIZEN: 'bg-indigo-100 text-indigo-800',
      POLITICAL_ANALYSIS: 'bg-pink-100 text-pink-800'
    }

    const emoji = surveyTypeEmoji[type] || '📋'

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        <span className="text-sm">{emoji}</span>
        {surveyTypeLabels[type] || type}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading && !surveys.length) {
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
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Surveys</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    fetchSurveys()
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
          <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
          <p className="text-gray-600 mt-1">Manage and review field survey data</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => window.open('/docs/BILINGUAL_SURVEY_FORMS.md', '_blank')}
            className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Forms
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Surveys"
            value={stats.totalSurveys}
            description={`${stats.byStatus.submitted} pending review`}
            icon={<FileText className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Hospital Surveys"
            value={stats.byType.hospital}
            description="Health facility assessments"
            icon={<Hospital className="w-6 h-6 text-red-600" />}
          />
          <StatsCard
            title="School Surveys"
            value={stats.byType.school}
            description="Education facility reviews"
            icon={<School className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Health Camps"
            value={stats.byType.healthCamp}
            description="Camp feedback collected"
            icon={<Heart className="w-6 h-6 text-green-600" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location, district, or surveyor..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="HOSPITAL">🏥 Hospital Survey</option>
              <option value="SCHOOL">🏫 School Survey</option>
              <option value="HEALTH_CAMP">⛑️ Health Camp</option>
              <option value="COMMUNITY_WELFARE">🤝 Community Welfare</option>
              <option value="STAFF_VOLUNTEER">👥 Staff & Volunteer</option>
              <option value="BUSINESS">💼 Business Survey</option>
              <option value="CITIZEN">👤 Citizen Survey</option>
              <option value="POLITICAL_ANALYSIS">🗳️ Political Analysis</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Surveys Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Survey Responses ({totalCount.toLocaleString()})
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
                  Survey Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Surveyor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.length > 0 ? (
                surveys.map((survey) => {
                  const Icon = surveyTypeIcons[survey.surveyType] || FileText
                  return (
                    <tr key={survey._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {surveyTypeLabels[survey.surveyType]}
                            </div>
                            {getSurveyTypeBadge(survey.surveyType)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{survey.location}</div>
                        <div className="text-sm text-gray-500">{survey.district}, {survey.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{survey.surveyorName}</div>
                        <div className="text-sm text-gray-500">{survey.surveyorContact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(survey.surveyDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(survey.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSurvey(survey)
                              setShowDetailsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {survey.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleUpdateStatus(survey._id, 'REVIEWED')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Reviewed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(survey._id, 'ARCHIVED')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {error ? `Error: ${error}` : 'No surveys found matching your criteria'}
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

      {/* Survey Details Modal */}
      {showDetailsModal && selectedSurvey && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowDetailsModal(false)}
              style={{ zIndex: 9998 }}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative" style={{ zIndex: 9999 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Survey Details</h3>
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
                      <label className="block text-sm font-medium text-gray-700">Survey Type</label>
                      <div className="mt-1">{getSurveyTypeBadge(selectedSurvey.surveyType)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedSurvey.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedSurvey.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District & State</label>
                      <p className="text-sm text-gray-900">{selectedSurvey.district}, {selectedSurvey.state}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Surveyor</label>
                      <p className="text-sm text-gray-900">{selectedSurvey.surveyorName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <p className="text-sm text-gray-900">{selectedSurvey.surveyorContact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Survey Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSurvey.surveyDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Submitted</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSurvey.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Survey Data */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Survey Data</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    {selectedSurvey.data && Object.keys(selectedSurvey.data).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedSurvey.data).map(([key, value]) => {
                          // Skip empty values
                          if (value === '' || value === null || value === undefined) return null
                          // Format array values
                          const displayValue = Array.isArray(value) 
                            ? value.length > 0 ? value.join(', ') : 'None'
                            : typeof value === 'object' 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                          
                          // Format key to readable label
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim()
                          
                          return (
                            <div key={key} className="border-b border-gray-200 pb-2">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
                              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{displayValue}</p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No survey data available</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedSurvey.notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
                    <p className="text-sm text-gray-700">{selectedSurvey.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedSurvey.status === 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedSurvey._id, 'REVIEWED')
                        setShowDetailsModal(false)
                      }}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedSurvey._id, 'ARCHIVED')
                      setShowDetailsModal(false)
                    }}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
