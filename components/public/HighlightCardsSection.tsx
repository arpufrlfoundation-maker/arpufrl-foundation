'use client'

import Link from 'next/link'
import { useContent } from '@/lib/content-provider'

export default function HighlightCardsSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full mx-auto mb-6"></div>
                  <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
                  <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content || !content.highlight_cards || content.highlight_cards.length === 0) {
    return null
  }

  const { highlight_cards } = content

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Key Focus Areas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the main areas where we're making a meaningful impact in communities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {highlight_cards.map((card, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-8 text-center hover:bg-gray-100 transition-colors group cursor-pointer"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">
                      {getIconForHighlight(card.title)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Explore All Programs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Helper function to get appropriate icons for different highlight categories
function getIconForHighlight(title: string): string {
  const titleLower = title.toLowerCase()

  if (titleLower.includes('children') || titleLower.includes('care')) return '👶'
  if (titleLower.includes('donate') || titleLower.includes('fund')) return '💝'
  if (titleLower.includes('donation') || titleLower.includes('plan')) return '📋'
  if (titleLower.includes('education')) return '📚'
  if (titleLower.includes('health')) return '🏥'
  if (titleLower.includes('environment')) return '🌱'

  return '🎯' // Default icon
}