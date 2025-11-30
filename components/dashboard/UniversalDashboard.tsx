/**
* Universal Dashboard Component
* Adapts to all 11 hierarchy levels with role-based features
* Samarpan Sahayog Abhiyan - National to Village Level Dashboard System
*/

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardStatsGrid } from './DashboardStatsCards'
import { PaymentWidget } from './PaymentWidget'
import { TeamNetworkView } from './TeamNetworkView'
import ManualDonationForm from './ManualDonationForm'
import { VolunteerDonationsList } from './VolunteerDonationsList'
import { Download, Share2, Bell, TrendingUp, BarChart3 } from 'lucide-react'

interface DashboardData {
  user: {
    id: string
    name: string
    role: string
    roleDisplay: string
    region?: string
    referralCode?: string
    upperCoordinator?: {
      id: string
      name: string
      role: string
      email: string
      phone?: string
    }
  }
  donations: {
    total: number
    amount: number
    personal: number
    personalAmount: number
  }
  team: {
    direct: number
    total: number
    active: number
    pending: number
  }
  hierarchy: {
    level: number
    levelName: string
  }
}

interface UniversalDashboardProps {
  className?: string
}

export function UniversalDashboard({ className = '' }: UniversalDashboardProps) {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentWidget, setShowPaymentWidget] = useState(true)
  const [generatingReferral, setGeneratingReferral] = useState(false)
  const [revenueData, setRevenueData] = useState<{
    totalEarned: number
    pending: number
    paid: number
    commissionCount: number
  } | null>(null)
  const [loadingRevenue, setLoadingRevenue] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (dashboardData && !dashboardData.user.role.includes('VOLUNTEER')) {
      fetchRevenueData()
    }
  }, [dashboardData])

  const fetchRevenueData = async () => {
    try {
      setLoadingRevenue(true)
      const response = await fetch('/api/revenue/commissions')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRevenueData(result.data.summary)
        }
      }
    } catch (err) {
      console.error('Error fetching revenue:', err)
    } finally {
      setLoadingRevenue(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/hierarchy')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      if (result.success) {
        setDashboardData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (!dashboardData?.user.referralCode) return

    const baseUrl = window.location.origin
    const referralLink = `${baseUrl}/donate?ref=${dashboardData.user.referralCode}`

    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied to clipboard!')
  }

  const generateReferralCode = async () => {
    try {
      setGeneratingReferral(true)
      const response = await fetch('/api/user/generate-referral', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate referral code')
      }

      // Refresh dashboard data to get the new referral code
      await fetchDashboardData()
      alert('Referral code generated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to generate referral code')
    } finally {
      setGeneratingReferral(false)
    }
  }

  const downloadIdCard = () => {
    alert('ID Card download feature coming soon!')
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { user, donations, team, hierarchy } = dashboardData
  const canViewTeam = hierarchy.level <= 10 // All except volunteer
  const canViewAnalytics = hierarchy.level <= 8 // Up to Nodal Officer
  const isVolunteer = user.role === 'VOLUNTEER'
  const isCoordinator = !isVolunteer && hierarchy.level <= 10 // All coordinator roles

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-lg text-green-600 mt-1">{user.roleDisplay}</p>
            {user.region && (
              <p className="text-sm text-gray-600 mt-1">Region: {user.region}</p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => alert('Notifications coming soon!')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <Bell className="h-6 w-6" />
            </button>

            {user.referralCode ? (
              <button
                onClick={copyReferralLink}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Share2 className="h-5 w-5" />
                <span>Share Referral</span>
              </button>
            ) : (
              <button
                onClick={generateReferralCode}
                disabled={generatingReferral}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="h-5 w-5" />
                <span>{generatingReferral ? 'Generating...' : 'Generate Referral'}</span>
              </button>
            )}

            <button
              onClick={downloadIdCard}
              className="flex items-center space-x-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              <Download className="h-5 w-5" />
              <span>ID Card</span>
            </button>
          </div>
        </div>

        {/* Upper Coordinator Info */}
        {user.upperCoordinator && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Your Coordinator</p>
                <p className="text-lg font-bold text-blue-700 mt-1">{user.upperCoordinator.name}</p>
                <p className="text-sm text-blue-600">{user.upperCoordinator.role}</p>
                {user.upperCoordinator.email && (
                  <p className="text-xs text-blue-600 mt-1">📧 {user.upperCoordinator.email}</p>
                )}
                {user.upperCoordinator.phone && (
                  <p className="text-xs text-blue-600">📱 {user.upperCoordinator.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Referral Code Display */}
        {user.referralCode && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Your Referral Code</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{user.referralCode}</p>
              </div>
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid
        stats={{
          donations: donations,
          team: team,
          hierarchy: hierarchy
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Network View */}
          {canViewTeam && (
            <TeamNetworkView userId={user.id} />
          )}

          {/* Quick Analytics */}
          {canViewAnalytics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    ₹{donations.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Total donations</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Team Growth</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {team.active}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Active members</p>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/dashboard/analytics'}
                className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
              >
                <TrendingUp className="h-5 w-5" />
                <span>View Detailed Analytics</span>
              </button>
            </div>
          )}

          {/* Revenue Section for Coordinators */}
          {isCoordinator && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Your Revenue</h3>
                </div>
                <button
                  onClick={fetchRevenueData}
                  disabled={loadingRevenue}
                  className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  {loadingRevenue ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingRevenue ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : revenueData ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Total Earned</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        ₹{revenueData.totalEarned.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">{revenueData.commissionCount} commissions</p>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900 mt-1">
                        ₹{revenueData.pending.toLocaleString()}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">Awaiting payment</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Paid</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        ₹{revenueData.paid.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Completed payments</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">Commission Rate</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {donations.amount > 0 ? ((revenueData.totalEarned / donations.amount) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Of total donations</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.href = '/dashboard/coordinator/revenue'}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>View Detailed Revenue</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
          )}

          {/* Manual Donation Form - Hidden for Volunteers */}
          {!isVolunteer && <ManualDonationForm />}

          {/* Volunteer Donations List */}
          {isVolunteer && user.referralCode && (
            <VolunteerDonationsList referralCode={user.referralCode} />
          )}

          {/* Volunteer Certificate Download */}
          {isVolunteer && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Certificate</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download your volunteer certificate here.
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/volunteer/certificate?userId=${user.id}`)
                    if (!response.ok) {
                      const error = await response.json()
                      alert(error.error || 'Failed to generate certificate')
                      return
                    }
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `volunteer-certificate-${user.name.replace(/\s/g, '-')}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (error) {
                    alert('Failed to download certificate')
                  }
                }}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-5 w-5" />
                <span>Download Certificate</span>
              </button>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New team member joined</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Donation received</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Payment Widget - Hidden for volunteers */}
          {showPaymentWidget && !isVolunteer && (
            <PaymentWidget
              referralCode={user.referralCode}
              userId={user.id}
              userName={user.name}
            />
          )}

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Your Impact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-90">Total Contributions</p>
                <p className="text-3xl font-bold">₹{donations.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Team Size</p>
                <p className="text-3xl font-bold">{team.total}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Network Reach</p>
                <p className="text-3xl font-bold">{hierarchy.levelName}</p>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Guidelines</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Share your referral code to grow your network
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Monitor your team's performance regularly
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Support subordinates for better results
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Download reports for offline review
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
