'use client'

import React, { useState, useEffect } from 'react'
import { UserRoleType } from '@/models/User'
import StatsCard from '@/components/dashboard/StatsCard'
import {
  DonationTrendChart,
  TargetProgressChart,
  ReferralDistributionChart,
  ProgressGauge
} from '@/components/analytics/AnalyticsCharts'
import { downloadCSV, donationsToCSV, targetsToCSV, generateCSVFilename } from '@/lib/csv-export'
import Image from 'next/image'

interface HierarchyDashboardProps {
  userId: string
  userRole: UserRoleType
  userName: string
  referralCode?: string
}

interface DashboardData {
  stats: {
    totalDonations: number
    totalAmount: number
    activeTargets: number
    completedTargets: number
    directSubordinates: number
    totalInHierarchy: number
  }
  donationTrend: Array<{ date: string; amount: number; count: number }>
  targetProgress: Array<{
    name: string
    target: number
    current: number
    percentage: number
  }>
  referralDistribution: Array<{ name: string; value: number }>
  recentDonations: Array<any>
  targets: Array<any>
  qrCodeUrl?: string
}

export default function HierarchyDashboard({
  userId,
  userRole,
  userName,
  referralCode
}: HierarchyDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'referrals' | 'team'>('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/${userId}`)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportDonations = () => {
    if (!dashboardData?.recentDonations) return
    const csv = donationsToCSV(dashboardData.recentDonations)
    downloadCSV(csv, generateCSVFilename('donations'))
  }

  const handleExportTargets = () => {
    if (!dashboardData?.targets) return
    const csv = targetsToCSV(dashboardData.targets)
    downloadCSV(csv, generateCSVFilename('targets'))
  }

  const handleShareReferral = async () => {
    if (!referralCode) return

    const referralUrl = `${window.location.origin}/donate?ref=${referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Support Our Cause',
          text: 'Make a donation using my referral code',
          url: referralUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralUrl)
      alert('Referral link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h1>
            <p className="text-gray-600 mt-1">Role: {userRole.replace(/_/g, ' ')}</p>
            {referralCode && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Referral Code:</span>
                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                  {referralCode}
                </code>
                <button
                  onClick={handleShareReferral}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Share
                </button>
              </div>
            )}
          </div>
          {dashboardData.qrCodeUrl && (
            <div className="flex flex-col items-center">
              <Image
                src={dashboardData.qrCodeUrl}
                alt="Referral QR Code"
                width={100}
                height={100}
                className="border-2 border-gray-200 rounded"
              />
              <span className="text-xs text-gray-600 mt-1">Scan to Donate</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'targets', label: 'Targets' },
              { key: 'referrals', label: 'Referrals' },
              { key: 'team', label: 'Team' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Donations"
                  value={dashboardData.stats.totalDonations}
                  description="Donations referred"
                  trend={{ value: 12, label: '+12% this month' }}
                />
                <StatsCard
                  title="Total Amount"
                  value={`₹${dashboardData.stats.totalAmount.toLocaleString()}`}
                  description="Raised through referrals"
                  trend={{ value: 8, label: '+8% this month' }}
                />
                <StatsCard
                  title="Active Targets"
                  value={dashboardData.stats.activeTargets}
                  description={`${dashboardData.stats.completedTargets} completed`}
                />
                <StatsCard
                  title="Team Size"
                  value={dashboardData.stats.directSubordinates}
                  description={`${dashboardData.stats.totalInHierarchy} in hierarchy`}
                />
              </div>

              {/* Donation Trend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Donation Trend (Last 30 Days)</h3>
                <DonationTrendChart data={dashboardData.donationTrend} />
              </div>

              {/* Target Progress */}
              {dashboardData.targetProgress.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Target Progress</h3>
                  <TargetProgressChart data={dashboardData.targetProgress} />
                </div>
              )}
            </div>
          )}

          {/* Targets Tab */}
          {activeTab === 'targets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">My Targets</h3>
                <button
                  onClick={handleExportTargets}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export CSV
                </button>
              </div>

              {dashboardData.targets.length === 0 ? (
                <p className="text-gray-600 text-center py-12">No targets assigned yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.targets.map((target: any) => (
                    <div key={target._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{target.type.replace(/_/g, ' ')}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs ${target.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : target.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {target.status}
                        </span>
                      </div>
                      <ProgressGauge
                        current={target.currentValue}
                        target={target.targetValue}
                        title=""
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Due: {new Date(target.endDate).toLocaleDateString()}</p>
                        {target.description && <p className="mt-1">{target.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Referral Performance</h3>
                <button
                  onClick={handleExportDonations}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export CSV
                </button>
              </div>

              {/* Referral Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-4">Distribution by Source</h4>
                <ReferralDistributionChart data={dashboardData.referralDistribution} />
              </div>

              {/* Recent Donations */}
              <div>
                <h4 className="font-semibold mb-4">Recent Donations</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Donor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.recentDonations.slice(0, 10).map((donation: any) => (
                        <tr key={donation._id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {donation.donorName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{donation.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs ${donation.paymentStatus === 'SUCCESS'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                              {donation.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Team Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Team members would be displayed here */}
                <p className="text-gray-600 col-span-full text-center py-12">
                  Team member details coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
