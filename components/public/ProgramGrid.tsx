'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import OptimizedImage from '@/components/common/OptimizedImage'
import { TrendingUp, Users, Target, Heart, ArrowRight, Sparkles } from 'lucide-react'

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
        setIsLoading(true)

        // Fetch programs from API
        const response = await fetch(`/api/programs?page=${currentPage}&limit=${programsPerPage}&active=true`)

        if (!response.ok) {
          throw new Error('Failed to fetch programs')
        }

        const data = await response.json()

        if (data.success && data.data) {
          setPrograms(data.data.programs || [])
          setTotalPages(data.data.pagination?.totalPages || 1)
        } else {
          setPrograms([])
        }
      } catch (error) {
        console.error('Error fetching programs:', error)
        setPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [currentPage])

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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
          <Sparkles className="w-3 h-3" />
          Fully Funded
        </span>
      )
    }

    if (program.featured) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
          <TrendingUp className="w-3 h-3" />
          Featured
        </span>
      )
    }

    const progress = calculateProgress(program.raisedAmount, program.targetAmount)
    if (progress < 25) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg animate-pulse">
          <Heart className="w-3 h-3" />
          Urgent Need
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg">
        <Target className="w-3 h-3" />
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
        {paginatedPrograms.map((program, index) => (
          <div
            key={program._id}
            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Program Image */}
            <div className="relative h-56 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 overflow-hidden">
              {program.image ? (
                <div className="relative w-full h-full">
                  <OptimizedImage
                    src={program.image}
                    alt={program.name}
                    width={400}
                    height={224}
                    className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500">
                  <div className="text-white text-7xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    {getCategoryIcon(program.category)}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(program)}
              </div>

              {/* Category Tag */}
              {program.category && (
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-md">
                    <span>{getCategoryIcon(program.category)}</span>
                    {program.category.charAt(0).toUpperCase() + program.category.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Program Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {program.name}
              </h3>

              <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                {program.description}
              </p>

              {/* Funding Progress */}
              {program.targetAmount && (
                <div className="mb-5">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      {formatAmount(program.raisedAmount)}
                    </span>
                    <span className="text-gray-500">
                      Goal: <span className="font-semibold text-gray-700">{formatAmount(program.targetAmount)}</span>
                    </span>
                  </div>

                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-md"
                      style={{ width: `${calculateProgress(program.raisedAmount, program.targetAmount)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {program.donationCount} donors
                    </span>
                    <span className="font-semibold text-indigo-600">
                      {calculateProgress(program.raisedAmount, program.targetAmount).toFixed(0)}% funded
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  asChild
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all group/btn"
                >
                  <Link href={`/donate?program=${program.slug}`} className="flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    Donate Now
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all group/btn"
                >
                  <Link href={`/programs/${program.slug}`} className="flex items-center justify-center gap-2">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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