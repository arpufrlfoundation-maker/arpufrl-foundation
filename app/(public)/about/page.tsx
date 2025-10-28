import AboutHero from '@/components/public/AboutHero'
import MissionVision from '@/components/public/MissionVision'
import TeamSection from '@/components/public/TeamSection'
import SuccessStories from '@/components/public/SuccessStories'
import OrganizationStats from '@/components/public/OrganizationStats'
import { generateMetadata, pageMetadata, generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata = generateMetadata(pageMetadata.about)

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About Us', url: '/about' },
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
        <AboutHero />

        {/* Mission & Vision */}
        <MissionVision />

        {/* Organization Stats */}
        <OrganizationStats />

        {/* Team Section */}
        <TeamSection />

        {/* Success Stories */}
        <SuccessStories />
      </div>
    </>
  )
}