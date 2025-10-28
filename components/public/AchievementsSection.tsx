'use client'

import { useContent } from '@/lib/content-provider'

export default function AchievementsSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-3/4 h-8 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
              <div className="w-full h-4 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full mb-4"></div>
                  <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mb-3"></div>
                  <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return null
  }

  const { achievements_section } = content

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {achievements_section.heading}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {achievements_section.text}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements_section.cards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">
                      {getIconForTitle(card.title)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Helper function to get appropriate icons for different achievement categories
function getIconForTitle(title: string): string {
  const titleLower = title.toLowerCase()

  if (titleLower.includes('child') || titleLower.includes('women')) return '👶'
  if (titleLower.includes('community') || titleLower.includes('development')) return '🏘️'
  if (titleLower.includes('environment') || titleLower.includes('sustainability')) return '🌱'
  if (titleLower.includes('senior') || titleLower.includes('citizen')) return '👴'
  if (titleLower.includes('education') || titleLower.includes('empowerment')) return '📚'
  if (titleLower.includes('research') || titleLower.includes('innovation')) return '🔬'
  if (titleLower.includes('differently') || titleLower.includes('abled')) return '♿'
  if (titleLower.includes('employment') || titleLower.includes('livelihood')) return '💼'
  if (titleLower.includes('health') || titleLower.includes('hygiene')) return '🏥'
  if (titleLower.includes('youth') || titleLower.includes('sports')) return '⚽'
  if (titleLower.includes('animal') || titleLower.includes('welfare')) return '🐕'
  if (titleLower.includes('disaster') || titleLower.includes('response')) return '🚨'

  return '🎯' // Default icon
}