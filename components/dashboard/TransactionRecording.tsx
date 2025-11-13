'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Upload, AlertCircle, CheckCircle, Calendar, User, CreditCard, Clock, XCircle, Image as ImageIcon, X } from 'lucide-react'
import { CloudinaryService } from '@/lib/cloudinary'

interface TransactionRecordingProps {
  onSuccess?: () => void
}

const paymentModes = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'online', label: 'Online Payment', icon: '💳' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '📋' }
]

export default function TransactionRecording({ onSuccess }: TransactionRecordingProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofImages, setProofImages] = useState<string[]>([])

  // Form fields
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [transactionId, setTransactionId] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorContact, setDonorContact] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchRecentTransactions()
  }, [])

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/create?limit=10')
      const data = await response.json()
      if (response.ok) {
        setRecentTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMode,
          transactionId: transactionId || undefined,
          receiptNumber: receiptNumber || undefined,
          donorName: donorName || undefined,
          donorContact: donorContact || undefined,
          donorEmail: donorEmail || undefined,
          purpose: purpose || undefined,
          notes: notes || undefined,
          collectionDate,
          attachments: proofImages
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record transaction')
      }

      setSuccess('Transaction recorded successfully! Awaiting verification.')

      // Reset form
      setAmount('')
      setTransactionId('')
      setReceiptNumber('')
      setDonorName('')
      setDonorContact('')
      setDonorEmail('')
      setPurpose('')
      setNotes('')
      setCollectionDate(new Date().toISOString().split('T')[0])
      setProofImages([])

      fetchRecentTransactions()

      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingProof(true)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(file =>
        CloudinaryService.uploadTransactionProof(file)
      )

      const results = await Promise.all(uploadPromises)

      const newUrls: string[] = []
      for (const result of results) {
        if (result.success && result.url) {
          newUrls.push(result.url)
        } else {
          throw new Error(result.error || 'Failed to upload proof')
        }
      }

      setProofImages(prev => [...prev, ...newUrls])
    } catch (err: any) {
      setError(err.message || 'Failed to upload proof images')
    } finally {
      setUploadingProof(false)
    }
  }

  const removeProofImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index))
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
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      verified: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    }
    const style = styles[status as keyof typeof styles]
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showHistory ? 'Hide History' : 'View Transaction History'}
        </button>
      </div>

      {/* Recent Transactions */}
      {showHistory && recentTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(txn.amount)}</span>
                    {getStatusBadge(txn.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="capitalize">{txn.paymentMode.replace('_', ' ')}</span>
                    {txn.receiptNumber && <span> • Receipt: {txn.receiptNumber}</span>}
                  </div>
                  {txn.donorName && (
                    <div className="text-sm text-gray-500 mt-1">Donor: {txn.donorName}</div>
                  )}
                  {txn.rejectionReason && (
                    <div className="text-sm text-red-600 mt-1">Reason: {txn.rejectionReason}</div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {formatDate(txn.collectionDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Transaction Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                required
                placeholder="e.g., 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Date *
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentModes.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setPaymentMode(mode.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${paymentMode === mode.value
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    <span className="text-2xl mb-1 block">{mode.icon}</span>
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMode === 'online' || paymentMode === 'upi' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., TXN123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g., RCP-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Donor Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Donor Information (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Name
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g., Rajesh Kumar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={donorContact}
                onChange={(e) => setDonorContact(e.target.value)}
                placeholder="e.g., 9876543210"
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="e.g., rajesh@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
            Additional Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Donation
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Education Program, Healthcare Initiative"
                maxLength={300}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Comments
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any additional information about this transaction..."
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Image Upload for Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof / Receipt (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                  />
                  {uploadingProof && (
                    <div className="flex items-center text-sm text-purple-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                </div>

                {proofImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {proofImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeProofImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Upload screenshots, photos of receipts, or payment confirmations (JPG, PNG, WebP)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Verification Required</p>
              <p>
                This transaction will be sent for verification by your coordinator or admin.
                Once verified, it will be automatically added to your target progress and
                propagated up the hierarchy.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setAmount('')
              setTransactionId('')
              setReceiptNumber('')
              setDonorName('')
              setDonorContact('')
              setDonorEmail('')
              setPurpose('')
              setNotes('')
              setError(null)
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Recording...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Record Transaction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
