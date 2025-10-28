'use client'

import { useContent } from '@/lib/content-provider'

export default function TeamSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="w-1/2 h-8 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
            <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center group">
                <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-full mx-auto mb-6"></div>
                <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
                <div className="w-full h-4 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
                <div className="w-full h-3 bg-gray-200 animate-pulse rounded mx-auto mb-1"></div>
                <div className="w-2/3 h-3 bg-gray-200 animate-pulse rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return null
  }

  const { team_section } = content

  // Show only first 8 members for homepage, or all if less than 8
  const displayMembers = team_section.members.slice(0, 8)

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {team_section.heading || 'Meet Our Team'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dedicated professionals working tirelessly to create positive change in communities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {displayMembers.map((member, index) => (
            <div key={index} className="text-center group">
              {/* Profile Image */}
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                {member.profile_image ? (
                  <img
                    src={member.profile_image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-blue-400 text-6xl">👤</div>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {member.name}
              </h3>

              <p className="text-blue-600 font-medium mb-4">
                {member.role}
              </p>
            </div>
          ))}
        </div>

        {/* Join Our Team CTA */}
        <div className="text-center mt-16">
          <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join Our Mission
            </h3>
            <p className="text-gray-600 mb-6">
              We're always looking for passionate individuals who want to make a difference.
              Whether you're interested in volunteering or joining our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Get Involved
              </a>
              <a
                href="/volunteer"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Volunteer With Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}