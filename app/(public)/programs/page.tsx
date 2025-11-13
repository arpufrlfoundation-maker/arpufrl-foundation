import { Suspense } from 'react'
import ProgramGrid from '@/components/public/ProgramGrid'
import ProgramFilters from '@/components/public/ProgramFilters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { generateMetadata, pageMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata(pageMetadata.programs)

export default function ProgramsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
  ]

  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <>
      {/* Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Page Header */}
        <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                  Making a Difference Together
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Our Programs
              </h1>

              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                Discover our comprehensive initiatives designed to create lasting positive change
                in education, healthcare, and community development across India.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Active Programs</p>
                    <p className="text-2xl font-bold">12+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Lives Impacted</p>
                    <p className="text-2xl font-bold">50K+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Communities</p>
                    <p className="text-2xl font-bold">100+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-12 md:h-16" viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 48H1440V0C1440 0 1140 48 720 48C300 48 0 0 0 0V48Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* Programs Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <Suspense fallback={<LoadingSpinner />}>
              <ProgramFilters />
            </Suspense>

            {/* Programs Grid */}
            <Suspense fallback={<LoadingSpinner />}>
              <ProgramGrid />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  )
}