'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Share2,
  Copy,
  Check,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  RefreshCw,
  Download,
  Sparkles,
  Plus
} from 'lucide-react'
import StatsCard from './StatsCard'
import confetti from 'canvas-confetti'

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalDonations: number
  totalAmount: number
  thisMonthDonations: number
  thisMonthAmount: number
}

interface ReferralCode {
  id: string
  code: string
  type: string
  active: boolean
  totalDonations: number
  totalAmount: number
  lastUsed?: string
  createdAt: string
}

interface Donation {
  id: string
  donorName: string
  amount: number
  programName?: string
  referralCode: string
  createdAt: string
}

export default function ReferralManagement() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [recentDonations, setRecentDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats
      const statsResponse = await fetch('/api/coordinators/referrals/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch referral codes
      const codesResponse = await fetch('/api/coordinators/referrals/codes')
      if (codesResponse.ok) {
        const codesData = await codesResponse.json()
        setReferralCodes(codesData.codes || [])
      }

      // Fetch recent donations
      const donationsResponse = await fetch('/api/coordinators/referrals/donations?limit=10')
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json()
        setRecentDonations(donationsData.donations || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReferralData()
    setRefreshing(false)
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateReferralCode = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/coordinators/referrals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate referral code')
      }

      const data = await response.json()

      // Add new code to the list
      setReferralCodes(prev => [data.code, ...prev])

      // Celebration effect!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      })

      // Refresh stats
      await fetchReferralData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate referral code')
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Referrals</h1>
          <p className="text-gray-600 mt-1">Track your referral codes and donation performance</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Referrals"
            value={stats.totalReferrals}
            description={`${stats.activeReferrals} active`}
            icon={<Share2 className="w-6 h-6 text-green-600" />}
          />
          <StatsCard
            title="Total Donations"
            value={stats.totalDonations}
            description={`${stats.thisMonthDonations} this month`}
            icon={<Users className="w-6 h-6 text-blue-600" />}
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            description={`${formatCurrency(stats.thisMonthAmount)} this month`}
            icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          />
          <StatsCard
            title="Growth"
            value={`${Math.round((stats.thisMonthAmount / stats.totalAmount) * 100)}%`}
            description="Monthly performance"
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          />
        </div>
      )}

      {/* Referral Codes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Referral Codes</h2>
            <p className="text-sm text-gray-600 mt-1">Share these codes to track donations</p>
          </div>
          <button
            onClick={generateReferralCode}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <Sparkles className="w-4 h-4" />
                Generate Code
              </>
            )}
          </button>
        </div>
        <div className="p-6">
          {referralCodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No referral codes found</p>
              <button
                onClick={generateReferralCode}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <Sparkles className="w-5 h-5" />
                    Generate Your First Referral Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {referralCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <code className="text-lg font-mono font-bold text-green-600 bg-green-50 px-3 py-1 rounded">
                        {code.code}
                      </code>
                      {code.active ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>{code.totalDonations} donations</span>
                      <span>•</span>
                      <span>{formatCurrency(code.totalAmount)} raised</span>
                      {code.lastUsed && (
                        <>
                          <span>•</span>
                          <span>Last used: {formatDate(code.lastUsed)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code.code)}
                    className="ml-4 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    {copiedCode === code.code ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
          <p className="text-sm text-gray-600 mt-1">Latest donations using your referral codes</p>
        </div>
        <div className="overflow-x-auto">
          {recentDonations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No donations yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{donation.donorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{donation.programName || 'General'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-gray-600">{donation.referralCode}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(donation.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
