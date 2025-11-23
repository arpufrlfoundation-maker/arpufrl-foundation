import HeroSection from '@/components/public/HeroSection'
import MissionSection from '@/components/public/MissionSection'
import DonorHighlights from '@/components/public/DonorHighlightsNew'
import AchievementsSection from '@/components/public/AchievementsSection'
import CallToActionSection from '@/components/public/CallToActionSection'
import FeaturedPrograms from '@/components/public/FeaturedPrograms'

// Main homepage with dynamic content components
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Donor Highlights */}
      <DonorHighlights />

      {/* Mission Section */}
      <MissionSection />

      {/* Achievements Section */}
      <AchievementsSection />

      {/* Featured Programs */}
      <FeaturedPrograms />

      {/* Call to Action Section */}
      <CallToActionSection />
    </div>
  )
}
