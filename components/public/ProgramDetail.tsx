'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Program {
  _id: string
  name: string
  nameHindi?: string
  slug: string
  description: string
  descriptionHindi?: string
  longDescription?: string
  longDescriptionHindi?: string
  image?: string
  gallery?: string[]
  targetAmount?: number
  raisedAmount: number
  donationCount: number
  active: boolean
  featured: boolean
  category?: string
  metaTitle?: string
  metaDescription?: string
}

interface ProgramDetailProps {
  program: Program
}

export default function ProgramDetail({ program }: ProgramDetailProps) {
  const [selectedImage, setSelectedImage] = useState(program.image || '')

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

  return (
    <div>
      {/* Breadcrumb */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/programs" className="hover:text-blue-600">Programs</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{program.name}</span>
          </nav>
        </div>
      </section>
      {/* Program Header */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div className="relative h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden mb-4">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={program.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-blue-400 text-8xl">
                      {getCategoryIcon(program.category)}
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {program.gallery && program.gallery.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {program.image && (
                    <button
                      onClick={() => setSelectedImage(program.image!)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === program.image ? 'border-blue-500' : 'border-gray-200'
                        }`}
                    >
                      <img
                        src={program.image}
                        alt={program.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                  {program.gallery.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === image ? 'border-blue-500' : 'border-gray-200'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${program.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Program Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getCategoryIcon(program.category)}</span>
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                  {program.category || 'Program'}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {program.name}
              </h1>
              {program.nameHindi && (
                <p className="text-xl text-orange-600 font-semibold mb-4">
                  {program.nameHindi}
                </p>
              )}

              <p className="text-xl text-gray-600 mb-4">
                {program.description}
              </p>
              {program.descriptionHindi && (
                <p className="text-lg text-gray-500 mb-8 italic border-l-4 border-orange-400 pl-4">
                  {program.descriptionHindi}
                </p>
              )}

              {/* Funding Progress */}
              {program.targetAmount && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatAmount(program.raisedAmount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        raised of {formatAmount(program.targetAmount)} goal
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {calculateProgress(program.raisedAmount, program.targetAmount).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">funded</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(program.raisedAmount, program.targetAmount)}%` }}
                    ></div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {program.donationCount} people have donated to this program
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="flex-1">
                  <Link href={`/donate?program=${program.slug}`}>
                    Donate to This Program
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link href="/contact">
                    Get Involved
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Program Details */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">About This Program</h2>

            {program.longDescription ? (
              <div className="prose prose-lg max-w-none">
                {program.longDescription.split('\n\n').map((paragraph, index) => {
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-4">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    )
                  }

                  if (paragraph.includes('**')) {
                    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g)
                    return (
                      <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={partIndex} className="font-semibold text-gray-900">
                                {part.replace(/\*\*/g, '')}
                              </strong>
                            )
                          }
                          return part
                        })}
                      </p>
                    )
                  }

                  return (
                    <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-700 text-lg leading-relaxed">
                {program.description}
              </p>
            )}

            {/* Hindi Long Description */}
            {program.longDescriptionHindi && (
              <div className="mt-12 pt-8 border-t-2 border-orange-200">
                <h2 className="text-2xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                  <span>🇮🇳</span> हिंदी में विवरण
                </h2>
                <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-400">
                  {program.longDescriptionHindi.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 mb-4 leading-relaxed text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your contribution can help us reach more people and create lasting positive change in communities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href={`/donate?program=${program.slug}`}>
                Donate Now
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/programs">
                View Other Programs
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}