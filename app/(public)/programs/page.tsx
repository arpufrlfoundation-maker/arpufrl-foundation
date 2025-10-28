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

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Our Programs
              </h1>
              <p className="text-lg md:text-xl text-gray-600">
                Discover our comprehensive initiatives designed to create lasting positive change
                in education, healthcare, and community development across India.
              </p>
            </div>
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