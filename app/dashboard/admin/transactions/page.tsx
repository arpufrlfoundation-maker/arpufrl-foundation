'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar, CreditCard, AlertCircle, Search, Filter } from 'lucide-react'

interface Transaction {
  id: string
  user: {
    name: string
    email: string
  }
  amount: number
  paymentMode: string
  transactionId?: string
  receiptNumber?: string
  status: 'pending' | 'verified' | 'rejected'
  verifiedBy?: {
    name: string
    email: string
  }
  verifiedAt?: string
  rejectionReason?: string
  donorName?: string
  donorContact?: string
  donorEmail?: string
  purpose?: string
  notes?: string
  collectionDate: string
  createdAt: string
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? '' : `&status=${filter}`
      const response = await fetch(`/api/transactions/verify?limit=100${statusParam}`)
      const data = await response.json()

      if (response.ok) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const handleVerify = async (transactionId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setVerifying(true)
      const response = await fetch('/api/transactions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action,
          reason: action === 'reject' ? rejectionReason : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully!`)
        setSelectedTransaction(null)
        setRejectionReason('')
        fetchTransactions()
      } else {
        alert(data.error || 'Failed to process transaction')
      }
    } catch (error) {
      console.error('Error verifying transaction:', error)
      alert('Failed to process transaction')
    } finally {
      setVerifying(false)
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      txn.user.name.toLowerCase().includes(search) ||
      txn.user.email.toLowerCase().includes(search) ||
      txn.donorName?.toLowerCase().includes(search) ||
      txn.receiptNumber?.toLowerCase().includes(search) ||
      txn.transactionId?.toLowerCase().includes(search)
    )
  })

  const stats = {
    pending: transactions.filter(t => t.status === 'pending').length,
    verified: transactions.filter(t => t.status === 'verified').length,
    rejected: transactions.filter(t => t.status === 'rejected').length,
    totalPending: transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
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

  const getStatusBadge = (status: string) => {
    if (!status) return null

    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
        {status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Verification</h1>
          <p className="text-gray-600 mt-1">
            Review and verify fund collection transactions from coordinators
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                <p className="text-xs text-yellow-700 mt-1">{formatCurrency(stats.totalPending)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Verified</p>
                <p className="text-2xl font-bold text-green-900">{stats.verified}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, receipt number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'verified'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collected By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.user.name}
                            </div>
                            <div className="text-sm text-gray-500">{transaction.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.donorName ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.donorName}
                            </div>
                            {transaction.donorContact && (
                              <div className="text-sm text-gray-500">{transaction.donorContact}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </div>
                        {transaction.receiptNumber && (
                          <div className="text-xs text-gray-500">
                            Receipt: {transaction.receiptNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {transaction.paymentMode.replace('_', ' ')}
                        </div>
                        {transaction.transactionId && (
                          <div className="text-xs text-gray-500 font-mono">
                            {transaction.transactionId.substring(0, 12)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.collectionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {transaction.status === 'pending' ? (
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setRejectionReason('')
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                              title="Approve transaction"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setRejectionReason('')
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                              title="Reject transaction"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={() => setSelectedTransaction(null)}
              />

              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>

                  {/* Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(selectedTransaction.amount)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <p className="text-lg text-gray-900 capitalize">
                        {selectedTransaction.paymentMode.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Collected By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Collected By</label>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <User className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedTransaction.user.name}</p>
                        <p className="text-sm text-gray-600">{selectedTransaction.user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Donor Information */}
                  {selectedTransaction.donorName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Donor Information</label>
                      <div className="p-3 bg-green-50 rounded-lg space-y-1">
                        <p className="font-medium text-gray-900">{selectedTransaction.donorName}</p>
                        {selectedTransaction.donorContact && (
                          <p className="text-sm text-gray-600">{selectedTransaction.donorContact}</p>
                        )}
                        {selectedTransaction.donorEmail && (
                          <p className="text-sm text-gray-600">{selectedTransaction.donorEmail}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTransaction.receiptNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedTransaction.receiptNumber}</p>
                      </div>
                    )}
                    {selectedTransaction.transactionId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                        <p className="text-sm text-gray-900 font-mono break-all">{selectedTransaction.transactionId}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedTransaction.collectionDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recorded At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                  </div>

                  {/* Purpose and Notes */}
                  {(selectedTransaction.purpose || selectedTransaction.notes) && (
                    <div className="space-y-3">
                      {selectedTransaction.purpose && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                          <p className="text-sm text-gray-900">{selectedTransaction.purpose}</p>
                        </div>
                      )}
                      {selectedTransaction.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <p className="text-sm text-gray-900">{selectedTransaction.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Attachments */}
                  {(selectedTransaction as any).attachments && (selectedTransaction as any).attachments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Proof Images</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedTransaction as any).attachments.map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
                          >
                            <img
                              src={url}
                              alt={`Proof ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Info */}
                  {selectedTransaction.status !== 'pending' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verification Details</label>
                      {selectedTransaction.verifiedBy && (
                        <p className="text-sm text-gray-900 mb-1">
                          Verified by: <span className="font-medium">{selectedTransaction.verifiedBy.name}</span>
                        </p>
                      )}
                      {selectedTransaction.verifiedAt && (
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedTransaction.verifiedAt)}
                        </p>
                      )}
                      {selectedTransaction.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">
                            <strong>Reason:</strong> {selectedTransaction.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {selectedTransaction.status === 'pending' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          placeholder="Enter reason for rejection..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleVerify(selectedTransaction.id, 'approve')}
                          disabled={verifying}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>{verifying ? 'Processing...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleVerify(selectedTransaction.id, 'reject')}
                          disabled={verifying}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>{verifying ? 'Processing...' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
}
