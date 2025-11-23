'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp } from 'lucide-react'

interface DonorHighlight {
  id: string
  name: string
  amount?: number
  isAnonymous: boolean
  displayFormat: string
  donationCount?: number
}

export default function DonorHighlights() {
  const [donors, setDonors] = useState<DonorHighlight[]>([])
  const [stats, setStats] = useState({ totalDonors: 0, totalAmount: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDonors()
  }, [])

  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/donors/highlights?limit=1000')
      const data = await response.json()
      
      if (data.success) {
        setDonors(data.data.donors)
        setStats({
          totalDonors: data.data.totalCount,
          totalAmount: data.data.donors.reduce((sum: number, d: DonorHighlight) => 
            sum + (d.amount || 0), 0
          )
        })
      }
    } catch (error) {
      console.error('Error fetching donors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    // Format with proper spacing, no compression
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    // Ensure proper spacing in the formatted output
    return formatted.replace(/₹(\d)/, '₹ $1')
  }

  // Generate avatar color based on index
  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-rose-500'
    ]
    return colors[index % colors.length]
  }

  // Get contribution percentage for visual bar
  const getContributionPercentage = (amount: number) => {
    if (!amount) return 0
    const maxAmount = Math.max(...donors.map(d => d.amount || 0))
    return Math.min((amount / maxAmount) * 100, 100)
  }

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 animate-pulse rounded-lg w-80 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded-lg w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Title Section - Centered */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Amazing Donors
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you to our generous supporters who make our mission possible. Your contributions are changing lives.
          </p>
        </div>

        {/* Statistics Cards - Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
          
          {/* Total Donors Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Donors
                </p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalDonors}</p>
              </div>
            </div>
          </div>

          {/* Amount Raised Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Amount Raised
                </p>
                <p className="text-4xl font-bold text-gray-900">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donor List - Horizontal Scrolling Loop */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll">
            {/* Duplicate donors array for seamless infinite loop */}
            {[...donors, ...donors].map((donor, index) => {
              const displayName = donor.displayFormat === 'anonymous' || donor.displayFormat === 'amount_only'
                ? 'Anonymous Donor'
                : donor.name
              const displayAmount = donor.amount && 
                (donor.displayFormat === 'name_amount' || donor.displayFormat === 'amount_only')
                ? donor.amount
                : null

              return (
                <div 
                  key={`${donor.id}-${index}`}
                  className="flex-shrink-0 w-80 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* Donor Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Donor Full Name */}
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {displayName}
                      </h3>
                      {donor.donationCount && donor.donationCount > 1 && (
                        <p className="text-sm text-gray-500">
                          {donor.donationCount} donations
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contribution Amount (₹X,XXX) */}
                  {displayAmount ? (
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatAmount(displayAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                        Generous Supporter
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>

        {/* Call to Action */}
        {donors.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 bg-white rounded-2xl p-8 shadow-sm max-w-lg mx-auto">
              <p className="text-gray-700 font-medium">
                Join our community of supporters
              </p>
              <a
                href="/donate"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Make a Donation
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
