/**
 * Dashboard Stats Cards Component
 * Displays key metrics for the user's dashboard
 */

'use client'

import { DollarSign, Users, TrendingUp, Target, Activity, Award } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: 'donations' | 'members' | 'growth' | 'target' | 'activity' | 'rewards'
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const iconMap = {
  donations: DollarSign,
  members: Users,
  growth: TrendingUp,
  target: Target,
  activity: Activity,
  rewards: Award
}

const colorMap = {
  donations: 'bg-green-100 text-green-600',
  members: 'bg-blue-100 text-blue-600',
  growth: 'bg-purple-100 text-purple-600',
  target: 'bg-orange-100 text-orange-600',
  activity: 'bg-pink-100 text-pink-600',
  rewards: 'bg-yellow-100 text-yellow-600'
}

export function DashboardStatsCard({ title, value, subtitle, icon, trend, className = '' }: StatsCardProps) {
  const Icon = iconMap[icon]
  const colorClass = colorMap[icon]

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

interface DashboardStatsGridProps {
  stats: {
    donations: {
      total: number
      amount: number
      personal?: number
      personalAmount?: number
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
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardStatsCard
        title="Total Donations"
        value={`₹${stats.donations.amount.toLocaleString()}`}
        subtitle={`${stats.donations.total} contributions`}
        icon="donations"
      />

      <DashboardStatsCard
        title="Personal Donations"
        value={`₹${(stats.donations.personalAmount || 0).toLocaleString()}`}
        subtitle={`${stats.donations.personal || 0} direct contributions`}
        icon="growth"
      />

      <DashboardStatsCard
        title="Team Size"
        value={stats.team.total}
        subtitle={`${stats.team.direct} direct reports`}
        icon="members"
      />

      <DashboardStatsCard
        title="Active Members"
        value={stats.team.active}
        subtitle={`${stats.team.pending} pending approval`}
        icon="activity"
      />

      <DashboardStatsCard
        title="Hierarchy Level"
        value={stats.hierarchy.level}
        subtitle={stats.hierarchy.levelName}
        icon="target"
      />

      <DashboardStatsCard
        title="Performance Score"
        value={calculatePerformanceScore(stats)}
        subtitle="Based on team and donations"
        icon="rewards"
      />
    </div>
  )
}

function calculatePerformanceScore(stats: DashboardStatsGridProps['stats']): string {
  const teamScore = Math.min((stats.team.total / 100) * 50, 50)
  const donationScore = Math.min((stats.donations.amount / 100000) * 50, 50)
  const total = Math.round(teamScore + donationScore)
  return `${total}%`
}
