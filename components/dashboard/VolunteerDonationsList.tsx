'use client'

import { useState, useEffect } from 'react'
import { IndianRupee, Calendar, User, Package } from 'lucide-react'

interface Donation {
  _id: string
  donorName: string
  amount: number
  createdAt: string
  programId?: {
    title: string
  }
  status: string
}

interface VolunteerDonationsListProps {
  referralCode: string
}

export function VolunteerDonationsList({ referralCode }: VolunteerDonationsListProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    thisMonth: 0
  })

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/donations/by-referral?referralCode=${encodeURIComponent(referralCode)}`)

        if (!response.ok) {
          throw new Error('Failed to fetch donations')
        }

        const data = await response.json()
        setDonations(data.donations || [])
        setStats(data.stats || { total: 0, totalAmount: 0, thisMonth: 0 })
      } catch (err) {
        console.error('Error fetching donations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load donations')
      } finally {
        setLoading(false)
      }
    }

    if (referralCode) {
      fetchDonations()
    }
  }, [referralCode])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referred Donations</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referred Donations</h3>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referred Donations</h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium">Total Donations</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium">This Month</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Donations List */}
      {donations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No donations via your referral code yet</p>
          <p className="text-sm mt-1">Share your referral code to start growing your impact!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {donations.map((donation) => (
            <div
              key={donation._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-4 w-4 text-gray-600" />
                  <p className="font-medium text-gray-900">{donation.donorName}</p>
                </div>

                {donation.programId && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="h-3 w-3 text-gray-500" />
                    <p className="text-sm text-gray-600">{donation.programId.title}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <p className="text-xs text-gray-500">
                    {new Date(donation.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                  <p className="text-xl font-bold text-green-600">
                    {donation.amount.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${donation.status === 'SUCCESS'
                      ? 'bg-green-100 text-green-700'
                      : donation.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                >
                  {donation.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
