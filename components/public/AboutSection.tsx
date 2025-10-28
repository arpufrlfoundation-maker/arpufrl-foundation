'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useContent } from '@/lib/content-provider'

export default function AboutSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              <div>
                <div className="w-3/4 h-8 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-2/3 h-4 bg-gray-200 animate-pulse rounded mb-6"></div>
                <div className="w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return null
  }

  const { about_section } = content

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* About Image */}
            <div className="relative order-2 md:order-1">
              {about_section.image ? (
                <img
                  src={about_section.image}
                  alt="About Us"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <div className="text-green-400 text-8xl">🏢</div>
                </div>
              )}
            </div>

            {/* About Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {about_section.heading}
              </h2>

              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {about_section.text}
              </p>

              <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                <Link href="/about">
                  Learn More About Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}