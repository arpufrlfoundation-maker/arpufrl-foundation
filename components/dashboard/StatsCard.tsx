import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className = ''
}: StatsCardProps) {
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600'
    if (trendValue < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>

      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>

      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}

      {trend && (
        <div className="flex items-center">
          <span className={`text-xs font-medium ${getTrendColor(trend.value)}`}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}