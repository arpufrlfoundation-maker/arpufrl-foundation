'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import CoordinatorDashboardLayout from '@/components/dashboard/CoordinatorDashboardLayout'
import CoordinatorOverview from '@/components/dashboard/CoordinatorOverview'
import ReferralCodeCard from '@/components/dashboard/ReferralCodeCard'
import SubCoordinatorManagement from '@/components/dashboard/SubCoordinatorManagement'
import CoordinatorHierarchyTree from '@/components/dashboard/CoordinatorHierarchyTree'
import ReferralAnalytics from '@/components/dashboard/ReferralAnalytics'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ReferralCodeData {
  id: string
  code: string
  totalDonations: number
  totalAmount: number
  lastUsed?: string
}

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession()
  const [referralCode, setReferralCode] = useState<ReferralCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      redirect('/login')
    }

    // Check if user is a coordinator (any coordinator role or admin)
    const coordinatorRoles = [
      'ADMIN',
      'CENTRAL_PRESIDENT',
      'STATE_PRESIDENT',
      'STATE_COORDINATOR',
      'ZONE_COORDINATOR',
      'DISTRICT_PRESIDENT',
      'DISTRICT_COORDINATOR',
      'BLOCK_COORDINATOR',
      'NODAL_OFFICER',
      'PRERAK',
      'PRERNA_SAKHI'
    ]

    if (!coordinatorRoles.includes(session.user.role)) {
      redirect('/')
    }

    fetchReferralCode()
  }, [session, status])

  const fetchReferralCode = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/coordinators/${session.user.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch coordinator data')
      }

      const data = await response.json()
      setReferralCode(data.referralCode)
    } catch (error) {
      console.error('Error fetching referral code:', error)
      setError(error instanceof Error ? error.message : 'Failed to load referral code')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <CoordinatorDashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-green-100">
            {session.user.role === 'COORDINATOR'
              ? 'Manage your coordination activities and track your fundraising performance.'
              : 'Track your sub-coordination activities and performance metrics.'
            }
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 text-red-500">⚠️</div>
              <h3 className="text-red-800 font-medium">Error</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <button
              onClick={fetchReferralCode}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Overview Stats */}
          <div className="xl:col-span-2">
            <CoordinatorOverview userId={session.user.id} />
          </div>

          {/* Right Column - Referral Code */}
          <div className="xl:col-span-1">
            <ReferralCodeCard
              referralCode={referralCode}
              loading={loading}
            />
          </div>
        </div>

        {/* Referral Analytics */}
        <ReferralAnalytics />

        {/* Sub-Coordinator Management - Only for Coordinators */}
        {session.user.role === 'COORDINATOR' && (
          <div className="space-y-8">
            <SubCoordinatorManagement />
            <CoordinatorHierarchyTree />
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Recent activity tracking coming soon...</p>
            <p className="text-sm text-gray-400 mt-1">
              This section will show your recent donations, sub-coordinator activities, and more.
            </p>
          </div>
        </div>
      </div>
    </CoordinatorDashboardLayout>
  )
}