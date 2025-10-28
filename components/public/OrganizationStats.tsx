'use client'

import { useEffect, useState } from 'react'

interface OrgStats {
  yearsActive: number
  totalBeneficiaries: number
  programsCompleted: number
  partnersCount: number
  volunteersCount: number
  statesServed: number
}

export default function OrganizationStats() {
  const [stats, setStats] = useState<OrgStats>({
    yearsActive: 0,
    totalBeneficiaries: 0,
    programsCompleted: 0,
    partnersCount: 0,
    volunteersCount: 0,
    statesServed: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800))

        setStats({
          yearsActive: 6,
          totalBeneficiaries: 25000,
          programsCompleted: 85,
          partnersCount: 32,
          volunteersCount: 150,
          statesServed: 5
        })
      } catch (error) {
        console.error('Error fetching organization stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

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
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact Over the Years
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Impact Over the Years
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Numbers that reflect our commitment to creating meaningful change
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
              {stats.yearsActive}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Years Active
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
              {formatNumber(stats.totalBeneficiaries)}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Lives Impacted
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
              {stats.programsCompleted}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Programs Completed
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
              {stats.partnersCount}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Partners
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
              {stats.volunteersCount}+
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Volunteers
            </div>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
              {stats.statesServed}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              States Served
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}