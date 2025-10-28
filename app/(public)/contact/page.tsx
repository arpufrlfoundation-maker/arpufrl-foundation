import ContactHero from '@/components/public/ContactHero'
import ContactForm from '@/components/forms/ContactForm'
import ContactInfo from '@/components/public/ContactInfo'
import LocationMap from '@/components/public/LocationMap'
import { generateMetadata, pageMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata(pageMetadata.contact)

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
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
        <ContactHero />

        {/* Contact Form & Info */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                <ContactForm />
              </div>

              {/* Contact Information */}
              <ContactInfo />
            </div>
          </div>
        </section>

        {/* Location Map */}
        <LocationMap />
      </div>
    </>
  )
}