import { Suspense } from 'react'
import GalleryGrid from '@/components/public/GalleryGrid'
import GalleryFilters from '@/components/public/GalleryFilters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { generateMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata({
  title: 'Photo Gallery - Capturing Our Journey & Impact',
  description: 'Explore ARPUFRL photo gallery showcasing our events, programs, team activities, and the positive impact we create in communities across India.',
  keywords: ['ARPUFRL gallery', 'ARPU photos', 'NGO events', 'community impact images', 'team photos', 'program pictures'],
  url: '/gallery',
})

export default function GalleryPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Gallery', url: '/gallery' },
  ]

  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  // Structured data for image gallery
  const galleryStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'ARPUFRL Photo Gallery',
    description: 'A collection of photographs from ARPUFRL events, programs, and community initiatives.',
    url: 'https://arpufrl.org/gallery',
    publisher: {
      '@type': 'Organization',
      name: 'ARPU Future Rise Life Foundation',
      url: 'https://arpufrl.org'
    }
  }

  return (
    <>
      {/* Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      
      {/* Structured Data for Gallery */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(galleryStructuredData),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Page Header */}
        <section className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                  📸 Our Visual Journey
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Photo Gallery
              </h1>

              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                Browse through moments captured from our events, programs, and community initiatives.
                Every image tells a story of hope, progress, and positive change.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Moments Captured</p>
                    <p className="text-2xl font-bold">500+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Events Covered</p>
                    <p className="text-2xl font-bold">50+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Stories Shared</p>
                    <p className="text-2xl font-bold">100+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-12 md:h-20 text-gray-50"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,130.83,141.14,214.09,120.42Z"
                className="fill-current"
              />
            </svg>
          </div>
        </section>

        {/* Gallery Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="mb-8">
              <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
                <GalleryFilters />
              </Suspense>
            </div>

            {/* Gallery Grid */}
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            }>
              <GalleryGrid />
            </Suspense>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Be Part of Our Story
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our community of changemakers and help us create more beautiful moments of impact and transformation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/volunteer"
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Become a Volunteer
              </a>
              <a
                href="/donate"
                className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-full border-2 border-purple-600 hover:bg-purple-50 transition-colors"
              >
                Support Our Cause
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
