import { generateMetadata, pageMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'
import DocumentsHero from '@/components/public/DocumentsHero'
import DocumentsGrid from '@/components/public/DocumentsGrid'

export const metadata = generateMetadata({
  ...pageMetadata.about,
  title: 'Documents & Certificates - ARPU Foundation',
  description: 'View our official documents, registrations, certificates and legal compliance documents'
})

export default function DocumentsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Documents', url: '/documents' },
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

      <div className="min-h-screen">
        {/* Hero Section */}
        <DocumentsHero />

        {/* Documents Grid */}
        <DocumentsGrid />
      </div>
    </>
  )
}
