import { generateMetadata, pageMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata(pageMetadata.stories)

export default function StoriesPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Stories', url: '/stories' },
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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Success Stories
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Read inspiring stories from our beneficiaries and see the real impact of your donations on communities across India.
            </p>
          </div>

          {/* Placeholder for success stories content */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">
              Success stories content will be added here. This section will showcase real impact stories from our programs.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}