import { Suspense } from 'react'
import HeroSection from '@/components/public/HeroSection'
import DonorHighlights from '@/components/public/DonorHighlights'
import HighlightCardsSection from '@/components/public/HighlightCardsSection'
import MissionSection from '@/components/public/MissionSection'
import AboutSection from '@/components/public/AboutSection'
import AchievementsSection from '@/components/public/AchievementsSection'
import ImpactStats from '@/components/public/ImpactStats'
import FeaturedPrograms from '@/components/public/FeaturedPrograms'
import TeamSection from '@/components/public/TeamSection'
import BlogSection from '@/components/public/BlogSection'
import CallToActionSection from '@/components/public/CallToActionSection'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Donor Highlights */}
      <Suspense fallback={<LoadingSpinner />}>
        <DonorHighlights />
      </Suspense>

      {/* Highlight Cards */}
      <Suspense fallback={<LoadingSpinner />}>
        <HighlightCardsSection />
      </Suspense>

      {/* Mission Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <MissionSection />
      </Suspense>

      {/* Call to Action */}
      <Suspense fallback={<LoadingSpinner />}>
        <CallToActionSection />
      </Suspense>

      {/* Achievements Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <AchievementsSection />
      </Suspense>

      {/* About Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <AboutSection />
      </Suspense>

      {/* Impact Statistics */}
      <Suspense fallback={<LoadingSpinner />}>
        <ImpactStats />
      </Suspense>

      {/* Featured Programs */}
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedPrograms />
      </Suspense>

      {/* Team Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <TeamSection />
      </Suspense>

      {/* Blog Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <BlogSection />
      </Suspense>
    </div>
  )
}