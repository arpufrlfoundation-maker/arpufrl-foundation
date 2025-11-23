'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface VolunteerRequest {
  _id: string
  name: string
  email: string
  phone: string
  state: string
  city: string
  interests: string[]
  message: string
  availability: string
  experience?: string
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: {
    name: string
    email: string
  }
  reviewNotes?: string
}

interface StatusCounts {
  pending: number
  reviewed: number
  accepted: number
  rejected: number
  total: number
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  REVIEWED: 'bg-blue-100 text-blue-800 border-blue-300',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300'
}

const interestLabels: Record<string, string> = {
  TEACHING: 'Teaching & Education',
  HEALTHCARE: 'Healthcare & Medical',
  FUNDRAISING: 'Fundraising & Events',
  SOCIAL_WORK: 'Social Work & Outreach',
  ADMINISTRATIVE: 'Administrative Support',
  TECHNICAL: 'Technical & IT Support',
  OTHER: 'Other'
}

export default function VolunteersAdminPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<VolunteerRequest[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<VolunteerRequest | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewNotes, setReviewNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const statusParam = selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''
      const response = await fetch(`/api/volunteer/requests?page=${page}&limit=10${statusParam}`)

      if (!response.ok) throw new Error('Failed to fetch requests')

      const data = await response.json()
      setRequests(data.data.requests || [])
      // API returns 'stats' not 'statusCounts'
      setStatusCounts(data.data.stats || {
        pending: 0,
        reviewed: 0,
        accepted: 0,
        rejected: 0,
        total: 0
      })
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [selectedStatus, page])

  const handleStatusUpdate = async (requestId: string, newStatus: 'REVIEWED' | 'ACCEPTED' | 'REJECTED') => {
    if (!reviewNotes.trim() && newStatus === 'REJECTED') {
      alert('Please provide notes when rejecting a request')
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/volunteer/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewNotes: reviewNotes || undefined })
      })

      if (!response.ok) throw new Error('Failed to update status')

      await fetchRequests()
      setSelectedRequest(null)
      setReviewNotes('')
      alert(`Request ${newStatus.toLowerCase()} successfully!`)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update request status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this volunteer request?')) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/volunteer/requests/${requestId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete request')

      await fetchRequests()
      setSelectedRequest(null)
      alert('Request deleted successfully!')
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Volunteer Requests</h1>
        <div className="text-sm text-gray-600">
          Logged in as: <span className="font-medium">{session?.user?.name}</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <p className="text-2xl font-bold text-gray-900">{statusCounts?.total || 0}</p>
          <p className="text-sm text-gray-600">All Requests</p>
        </div>

        <div
          onClick={() => setSelectedStatus('PENDING')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === 'PENDING' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <p className="text-2xl font-bold text-yellow-700">{statusCounts?.pending || 0}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>

        <div
          onClick={() => setSelectedStatus('REVIEWED')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === 'REVIEWED' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <p className="text-2xl font-bold text-blue-700">{statusCounts?.reviewed || 0}</p>
          <p className="text-sm text-gray-600">Reviewed</p>
        </div>

        <div
          onClick={() => setSelectedStatus('ACCEPTED')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === 'ACCEPTED' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <p className="text-2xl font-bold text-green-700">{statusCounts?.accepted || 0}</p>
          <p className="text-sm text-gray-600">Accepted</p>
        </div>

        <div
          onClick={() => setSelectedStatus('REJECTED')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === 'REJECTED' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <p className="text-2xl font-bold text-red-700">{statusCounts?.rejected || 0}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volunteer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No volunteer requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">{request.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          {request.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {request.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {request.city}, {request.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.interests.slice(0, 2).map((interest) => (
                          <span
                            key={interest}
                            className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded"
                          >
                            {interestLabels[interest] || interest}
                          </span>
                        ))}
                        {request.interests.length > 2 && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            +{request.interests.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(request.submittedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Volunteer Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 text-sm font-medium rounded-full border ${statusColors[selectedRequest.status]}`}>
                  {selectedRequest.status}
                </span>
                <p className="text-sm text-gray-500">
                  Submitted: {formatDate(selectedRequest.submittedAt)}
                </p>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="font-medium text-gray-900">{selectedRequest.availability}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{selectedRequest.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium text-gray-900">{selectedRequest.state}</p>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas of Interest</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full"
                    >
                      {interestLabels[interest] || interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.message}</p>
              </div>

              {/* Experience */}
              {selectedRequest.experience && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Previous Experience</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.experience}</p>
                </div>
              )}

              {/* Review Info */}
              {selectedRequest.reviewedAt && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Reviewed by: <span className="font-medium text-gray-900">{selectedRequest.reviewedBy?.name || 'Unknown'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Reviewed at: <span className="font-medium text-gray-900">{formatDate(selectedRequest.reviewedAt)}</span>
                    </p>
                    {selectedRequest.reviewNotes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Review Notes:</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{selectedRequest.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Notes Input */}
              {selectedRequest.status !== 'ACCEPTED' && selectedRequest.status !== 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes about this review..."
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => handleDelete(selectedRequest._id)}
                  disabled={actionLoading}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <div className="flex space-x-3">
                  {selectedRequest.status !== 'REJECTED' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'REJECTED')}
                      disabled={actionLoading}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}

                  {selectedRequest.status === 'PENDING' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'REVIEWED')}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark Reviewed
                    </Button>
                  )}

                  {selectedRequest.status !== 'ACCEPTED' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'ACCEPTED')}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
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
