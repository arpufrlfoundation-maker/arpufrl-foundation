import { Suspense } from 'react'
import HeroSection from '@/components/public/HeroSection'
import FeaturedPrograms from '@/components/public/FeaturedPrograms'
import ImpactStats from '@/components/public/ImpactStats'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Impact Statistics */}
      <Suspense fallback={<LoadingSpinner />}>
        <ImpactStats />
      </Suspense>

      {/* Featured Programs */}
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedPrograms />
      </Suspense>
    </div>
  )
}