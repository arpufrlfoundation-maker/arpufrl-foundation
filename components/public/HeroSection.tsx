'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Empowering Communities,
            <span className="block text-yellow-300">Transforming Lives</span>
          </h1>

          {/* Mission statement */}
          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            ARPU Future Rise Life Foundation is dedicated to creating sustainable change through
            education, healthcare, and community development programs across India.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 text-lg"
            >
              <Link href="/donate">Donate Now</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg"
            >
              <Link href="/programs">View Programs</Link>
            </Button>
          </div>

          {/* Quick impact stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-300">10,000+</div>
              <div className="text-sm md:text-base text-blue-200">Lives Impacted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-300">50+</div>
              <div className="text-sm md:text-base text-blue-200">Active Programs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-300">₹2.5Cr+</div>
              <div className="text-sm md:text-base text-blue-200">Funds Raised</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-16 fill-white"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  )
}