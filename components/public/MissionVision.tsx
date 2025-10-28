'use client'

import { useContent } from '@/lib/content-provider'

export default function MissionVision() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-1/2 h-8 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
              <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="text-center md:text-left">
                <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full mx-auto md:mx-0 mb-6"></div>
                <div className="w-1/2 h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="text-center md:text-left">
                <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full mx-auto md:mx-0 mb-6"></div>
                <div className="w-1/2 h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Mission & Vision
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Guided by our core values and commitment to social change
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed">
                  To empower underprivileged communities through sustainable development programs
                  in education, healthcare, and social welfare.
                </p>
              </div>
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <span className="text-2xl">👁️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700 leading-relaxed">
                  A society where every individual has equal access to opportunities for growth,
                  education, and healthcare.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Use dynamic content from about_page if available, otherwise fallback to static content
  const missionData = content.about_page?.mission
  const visionData = content.about_page?.vision

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Mission & Vision
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Guided by our core values and commitment to social change
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Mission */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {missionData?.title || 'Our Mission'}
              </h3>
              {missionData?.points ? (
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  {missionData.points.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  To empower underprivileged communities through sustainable development programs
                  in education, healthcare, and social welfare. We strive to create lasting positive
                  change by addressing root causes of poverty and inequality while fostering
                  self-reliance and community ownership.
                </p>
              )}
            </div>

            {/* Vision */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {visionData?.title || 'Our Vision'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {visionData?.description ||
                  'A society where every individual has equal access to opportunities for growth, education, and healthcare. We envision thriving communities that are self-sufficient, environmentally conscious, and socially inclusive, where no one is left behind in the journey towards progress.'
                }
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h3>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <span className="text-xl">🤝</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Integrity</h4>
                <p className="text-sm text-gray-600">
                  Transparency and honesty in all our operations and relationships
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <span className="text-xl">💚</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Compassion</h4>
                <p className="text-sm text-gray-600">
                  Empathy and understanding for those we serve and work with
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <span className="text-xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Innovation</h4>
                <p className="text-sm text-gray-600">
                  Creative solutions to address complex social challenges
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <span className="text-xl">🌱</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Sustainability</h4>
                <p className="text-sm text-gray-600">
                  Long-term solutions that benefit communities and environment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}