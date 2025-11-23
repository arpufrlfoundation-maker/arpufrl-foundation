'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, ChevronRight, ArrowLeft } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  region: string
  photoURL?: string
  referralCode?: string
  totalDonations: number
  totalAmount: number
  subordinatesCount: number
  hasSubordinates: boolean
}

export default function TeamSection() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [subordinates, setSubordinates] = useState<TeamMember[]>([])
  const [loadingSubordinates, setLoadingSubordinates] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async (parentId?: string) => {
    try {
      setLoading(true)
      const url = parentId ? `/api/team?parentId=${parentId}` : '/api/team'
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        if (parentId) {
          setSubordinates(data.members)
        } else {
          setTeamMembers(data.members)
        }
      } else {
        setError(data.error || 'Failed to load team members')
      }
    } catch (err) {
      setError('Failed to load team members')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMemberClick = async (member: TeamMember) => {
    if (!member.hasSubordinates) return

    setLoadingSubordinates(true)
    setSelectedMemberId(member.id)
    setBreadcrumb([...breadcrumb, { id: member.id, name: member.name }])

    try {
      const response = await fetch(`/api/team?parentId=${member.id}`)
      const data = await response.json()

      if (data.success) {
        setSubordinates(data.members)
      }
    } catch (err) {
      console.error('Failed to load subordinates:', err)
    } finally {
      setLoadingSubordinates(false)
    }
  }

  const handleBackClick = () => {
    if (breadcrumb.length === 0) {
      setSelectedMemberId(null)
      setSubordinates([])
      return
    }

    const newBreadcrumb = [...breadcrumb]
    newBreadcrumb.pop()
    setBreadcrumb(newBreadcrumb)

    if (newBreadcrumb.length === 0) {
      setSelectedMemberId(null)
      setSubordinates([])
    } else {
      const parent = newBreadcrumb[newBreadcrumb.length - 1]
      setSelectedMemberId(parent.id)
      fetchTeamMembers(parent.id)
    }
  }

  const getRoleDisplay = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading && teamMembers.length === 0) {
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
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayMembers = selectedMemberId ? subordinates : teamMembers

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dedicated professionals working tirelessly to create positive change in communities
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        {breadcrumb.length > 0 && (
          <div className="mb-8 flex items-center justify-center">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="ml-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Team</span>
              {breadcrumb.map((crumb, index) => (
                <span key={crumb.id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium">{crumb.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 mb-8">
            {error}
          </div>
        )}

        {loadingSubordinates ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading team members...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {displayMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleMemberClick(member)}
                  className={`text-center group ${member.hasSubordinates ? 'cursor-pointer' : ''
                    }`}
                >
                  {/* Profile Image */}
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-blue-400 text-6xl">👤</div>
                      </div>
                    )}

                    {/* Subordinates Badge */}
                    {member.hasSubordinates && (
                      <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {member.subordinatesCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>

                  <p className="text-blue-600 font-medium mb-2">
                    {getRoleDisplay(member.role)}
                  </p>

                  <p className="text-sm text-gray-500 mb-4">
                    📍 {member.region}
                  </p>

                  {/* Stats */}
                  {/* {member.totalDonations > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {formatAmount(member.totalAmount)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {member.totalDonations} donations
                      </p>
                    </div>
                  )} */}

                  {/* Click indicator */}
                  {member.hasSubordinates && (
                    <div className="mt-4 text-sm text-blue-600 font-medium group-hover:underline">
                      View Team ({member.subordinatesCount}) →
                    </div>
                  )}
                </div>
              ))}
            </div>

            {displayMembers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No team members found</p>
              </div>
            )}
          </>
        )}

        {/* Join Our Team CTA */}
        {!selectedMemberId && (
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
                  href="/volunteer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Apply to Volunteer
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}