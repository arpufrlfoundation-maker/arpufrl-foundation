'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  totalDonations: number
  totalAmount: number
  activePrograms: number
  beneficiaries: number
}

export default function ImpactStats() {
  const [stats, setStats] = useState<StatsData>({
    totalDonations: 0,
    totalAmount: 0,
    activePrograms: 0,
    beneficiaries: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with actual API endpoint
    const fetchStats = async () => {
      try {
        // Mock data for now - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        setStats({
          totalDonations: 2847,
          totalAmount: 25600000, // ₹2.56 Cr
          activePrograms: 52,
          beneficiaries: 12500
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how your contributions are making a real difference in communities across India
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-8 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
                <div className="w-20 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how your contributions are making a real difference in communities across India
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
              {formatNumber(stats.totalDonations)}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Total Donations
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
              {formatAmount(stats.totalAmount)}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Funds Raised
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
              {stats.activePrograms}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Active Programs
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
              {formatNumber(stats.beneficiaries)}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Lives Impacted
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}