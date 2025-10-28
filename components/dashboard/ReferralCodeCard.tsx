'use client'

import { useState } from 'react'
import { Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react'

interface ReferralCodeCardProps {
  referralCode: {
    id: string
    code: string
    totalDonations: number
    totalAmount: number
    lastUsed?: string
  } | null
  loading?: boolean
}

export default function ReferralCodeCard({ referralCode, loading }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (!referralCode?.code) return

    try {
      await navigator.clipboard.writeText(referralCode.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy referral code:', error)
    }
  }

  const handleCopyDonationLink = async () => {
    if (!referralCode?.code) return

    const donationUrl = `${window.location.origin}/donate?ref=${referralCode.code}`

    try {
      await navigator.clipboard.writeText(donationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy donation link:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never used'

    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!referralCode) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Referral Code</h3>
          <p className="text-gray-500 mb-4">
            You don't have an active referral code yet. Contact your administrator to get one assigned.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Referral Code</h3>
            <p className="text-sm text-gray-500 mt-1">
              Share this code to track donations attributed to you
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code
              </label>
              <div className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {referralCode.code}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Raised</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(referralCode.totalAmount)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">₹</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Donations</p>
                <p className="text-2xl font-bold text-green-900">
                  {referralCode.totalDonations}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">#</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Average Donation</p>
                <p className="text-2xl font-bold text-purple-900">
                  {referralCode.totalDonations > 0
                    ? formatCurrency(referralCode.totalAmount / referralCode.totalDonations)
                    : formatCurrency(0)
                  }
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">~</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Used */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Last Used</p>
              <p className="text-sm text-gray-600">{formatDate(referralCode.lastUsed)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyDonationLink}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Copy Donation Link</span>
          </button>

          <button
            onClick={() => {
              const donationUrl = `${window.location.origin}/donate?ref=${referralCode.code}`
              window.open(donationUrl, '_blank')
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview Donation Page</span>
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How to use your referral code:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share your referral code with potential donors</li>
            <li>• Ask them to enter it when making a donation</li>
            <li>• All donations with your code will be attributed to you</li>
            <li>• Track your performance in the analytics section</li>
          </ul>
        </div>
      </div>
    </div>
  )
}