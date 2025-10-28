'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Program {
  _id: string
  name: string
  slug: string
  description: string
  image?: string
  targetAmount?: number
  raisedAmount: number
  donationCount: number
}

export default function FeaturedPrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedPrograms = async () => {
      try {
        // Mock data for now - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800))

        setPrograms([
          {
            _id: '1',
            name: 'Education for All',
            slug: 'education-for-all',
            description: 'Providing quality education and learning resources to underprivileged children in rural communities.',
            image: '/images/education-program.jpg',
            targetAmount: 500000,
            raisedAmount: 325000,
            donationCount: 156
          },
          {
            _id: '2',
            name: 'Healthcare Access',
            slug: 'healthcare-access',
            description: 'Ensuring basic healthcare services and medical support reach remote villages and urban slums.',
            image: '/images/healthcare-program.jpg',
            targetAmount: 750000,
            raisedAmount: 480000,
            donationCount: 203
          },
          {
            _id: '3',
            name: 'Clean Water Initiative',
            slug: 'clean-water-initiative',
            description: 'Building sustainable water systems and promoting hygiene awareness in water-scarce regions.',
            image: '/images/water-program.jpg',
            targetAmount: 300000,
            raisedAmount: 180000,
            donationCount: 89
          }
        ])
      } catch (error) {
        console.error('Error fetching featured programs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedPrograms()
  }, [])

  const calculateProgress = (raised: number, target?: number) => {
    if (!target) return 0
    return Math.min((raised / target) * 100, 100)
  }

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount}`
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Support our ongoing initiatives that are creating lasting change in communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mb-3"></div>
                  <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
                  <div className="w-full h-2 bg-gray-200 animate-pulse rounded mb-4"></div>
                  <div className="w-1/2 h-8 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Programs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Support our ongoing initiatives that are creating lasting change in communities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {programs.map((program) => (
            <div key={program._id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {/* Program Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
                {program.image ? (
                  <img
                    src={program.image}
                    alt={program.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-blue-400 text-6xl">📚</div>
                  </div>
                )}
              </div>

              {/* Program Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {program.name}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {program.description}
                </p>

                {/* Funding Progress */}
                {program.targetAmount && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Raised: {formatAmount(program.raisedAmount)}</span>
                      <span>Goal: {formatAmount(program.targetAmount)}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(program.raisedAmount, program.targetAmount)}%` }}
                      ></div>
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      {program.donationCount} donors • {calculateProgress(program.raisedAmount, program.targetAmount).toFixed(0)}% funded
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <Link href={`/donate?program=${program.slug}`}>
                      Donate Now
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/programs/${program.slug}`}>
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Programs Button */}
        <div className="text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/programs">
              View All Programs
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}