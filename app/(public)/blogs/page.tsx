import { Suspense } from 'react'
import Link from 'next/link'
import BlogGrid from '@/components/public/BlogGrid'
import BlogFilters from '@/components/public/BlogFilters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { generateMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata({
  title: 'Blogs & Success Stories - ARPUFRL',
  description: 'Read inspiring success stories and insightful blogs from ARPUFRL. Discover the real impact of our programs and the stories of communities we serve.',
  keywords: ['blogs', 'success stories', 'ARPUFRL blog', 'impact stories', 'community impact', 'testimonials'],
  url: '/blogs'
})

export default function BlogsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blogs', url: '/blogs' },
  ]

  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  // Structured data for blog collection
  const blogCollectionData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ARPUFRL Blog',
    description: 'Inspiring stories and insightful articles about our programs and impact',
    url: 'https://arpufrl.org/blogs',
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
      
      {/* Structured Data for Blog Collection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogCollectionData),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Page Header */}
        <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                  📖 Our Stories & Insights
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Blogs & Success Stories
              </h1>

              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                Read inspiring success stories and insightful articles about our programs, the communities we serve, 
                and the positive impact we&apos;re making together.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Articles</p>
                    <p className="text-2xl font-bold">50+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Success Stories</p>
                    <p className="text-2xl font-bold">100+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Lives Impacted</p>
                    <p className="text-2xl font-bold">1000+</p>
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

        {/* Blog Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="mb-8">
              <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
                <BlogFilters />
              </Suspense>
            </div>

            {/* Blog Grid */}
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            }>
              <BlogGrid />
            </Suspense>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Have Your Own Success Story?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We&apos;d love to hear about the impact you&apos;ve made or how our programs have helped you. Share your story with us.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get in Touch
              </Link>
              <Link
                href="/donate"
                className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-full border-2 border-purple-600 hover:bg-purple-50 transition-colors"
              >
                Support Our Mission
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
