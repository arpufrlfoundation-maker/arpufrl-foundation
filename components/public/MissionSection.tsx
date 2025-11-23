'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useContent } from '@/lib/content-provider'

export default function MissionSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-3/4 h-8 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mb-6"></div>
                <div className="w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return null
  }

  const { mission_section } = content

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Mission Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {mission_section.heading}
              </h2>

              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {mission_section.text}
              </p>

              {mission_section.button && (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href={mission_section.button.link || "#"}>
                    {mission_section.button.label}
                  </Link>
                </Button>
              )}
            </div>

            {/* Mission Image */}
            <div className="relative">
              {mission_section.image ? (
                <img
                  src={mission_section.image}
                  alt="Our Mission"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <img
                  src="/pic/about_our.jpg"
                  alt="Our Mission"
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't load
                    e.currentTarget.style.display = 'none'
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
              )}
              <div className="hidden w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg items-center justify-center">
                <div className="text-blue-400 text-8xl">
                  🤝
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}