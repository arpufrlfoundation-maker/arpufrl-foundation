'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import OptimizedImage from '@/components/common/OptimizedImage'

interface Program {
  _id: string
  name: string
  slug: string
  description: string
  longDescription?: string
  image?: string
  targetAmount?: number
  raisedAmount: number
  donationCount: number
  active: boolean
  featured: boolean
  category?: string
}

export default function ProgramGrid() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const programsPerPage = 9

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // Mock data for now - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        const mockPrograms: Program[] = [
          {
            _id: '1',
            name: 'Education for All',
            slug: 'education-for-all',
            description: 'Providing quality education and learning resources to underprivileged children in rural communities.',
            longDescription: 'Our Education for All program focuses on bridging the educational gap in rural India by providing comprehensive learning resources, trained teachers, and modern infrastructure to underserved communities.',
            image: '/images/education-program.jpg',
            targetAmount: 500000,
            raisedAmount: 325000,
            donationCount: 156,
            active: true,
            featured: true,
            category: 'education'
          },
          {
            _id: '2',
            name: 'Healthcare Access',
            slug: 'healthcare-access',
            description: 'Ensuring basic healthcare services and medical support reach remote villages and urban slums.',
            longDescription: 'Healthcare Access initiative brings essential medical services to underserved areas through mobile clinics, telemedicine, and community health worker training programs.',
            image: '/images/healthcare-program.jpg',
            targetAmount: 750000,
            raisedAmount: 480000,
            donationCount: 203,
            active: true,
            featured: true,
            category: 'healthcare'
          },
          {
            _id: '3',
            name: 'Clean Water Initiative',
            slug: 'clean-water-initiative',
            description: 'Building sustainable water systems and promoting hygiene awareness in water-scarce regions.',
            longDescription: 'Our Clean Water Initiative focuses on providing sustainable access to clean drinking water through well construction, water purification systems, and community education programs.',
            image: '/images/water-program.jpg',
            targetAmount: 300000,
            raisedAmount: 180000,
            donationCount: 89,
            active: true,
            featured: false,
            category: 'water'
          },
          {
            _id: '4',
            name: 'Women Empowerment',
            slug: 'women-empowerment',
            description: 'Empowering women through skill development, entrepreneurship training, and financial literacy programs.',
            longDescription: 'Women Empowerment program provides comprehensive support to women through vocational training, microfinance opportunities, and leadership development initiatives.',
            targetAmount: 400000,
            raisedAmount: 120000,
            donationCount: 67,
            active: true,
            featured: false,
            category: 'community'
          },
          {
            _id: '5',
            name: 'Environmental Conservation',
            slug: 'environmental-conservation',
            description: 'Protecting natural resources through reforestation, waste management, and sustainable farming practices.',
            longDescription: 'Environmental Conservation program promotes sustainable living through tree plantation drives, waste management systems, and organic farming education.',
            targetAmount: 600000,
            raisedAmount: 350000,
            donationCount: 145,
            active: true,
            featured: false,
            category: 'environment'
          },
          {
            _id: '6',
            name: 'Digital Literacy',
            slug: 'digital-literacy',
            description: 'Bridging the digital divide by providing computer education and internet access to rural communities.',
            longDescription: 'Digital Literacy program aims to reduce the digital divide by establishing computer centers and providing digital skills training in rural areas.',
            targetAmount: 250000,
            raisedAmount: 95000,
            donationCount: 42,
            active: true,
            featured: false,
            category: 'education'
          }
        ]

        setPrograms(mockPrograms)
        setTotalPages(Math.ceil(mockPrograms.length / programsPerPage))
      } catch (error) {
        console.error('Error fetching programs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
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

  const getStatusBadge = (program: Program) => {
    if (program.targetAmount && program.raisedAmount >= program.targetAmount) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Fully Funded
        </span>
      )
    }

    if (program.featured) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Featured
        </span>
      )
    }

    const progress = calculateProgress(program.raisedAmount, program.targetAmount)
    if (progress < 25) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Urgent Need
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Active
      </span>
    )
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'education': return '📚'
      case 'healthcare': return '🏥'
      case 'water': return '💧'
      case 'environment': return '🌱'
      case 'community': return '🤝'
      default: return '🎯'
    }
  }

  const paginatedPrograms = programs.slice(
    (currentPage - 1) * programsPerPage,
    currentPage * programsPerPage
  )

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-6">
              <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="w-full h-2 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-200 animate-pulse rounded"></div>
                <div className="flex-1 h-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Programs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {paginatedPrograms.map((program) => (
          <div key={program._id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {/* Program Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
              {program.image ? (
                <OptimizedImage
                  src={program.image}
                  alt={program.name}
                  width={400}
                  height={192}
                  className="w-full h-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-blue-400 text-6xl">
                    {getCategoryIcon(program.category)}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                {getStatusBadge(program)}
              </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* No Results */}
      {programs.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  )
}