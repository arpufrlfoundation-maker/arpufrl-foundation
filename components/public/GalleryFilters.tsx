'use client'

import { useSearchParams } from 'next/navigation'
import { GalleryCategory } from '@/models/Gallery'

const categories = [
  { value: '', label: 'All Photos', icon: '📷' },
  { value: GalleryCategory.EVENTS, label: 'Events', icon: '🎉' },
  { value: GalleryCategory.CAMPUS, label: 'Campus', icon: '🏛️' },
  { value: GalleryCategory.PROGRAMS, label: 'Programs', icon: '📋' },
  { value: GalleryCategory.TEAM, label: 'Team', icon: '👥' },
  { value: GalleryCategory.VOLUNTEERS, label: 'Volunteers', icon: '🤝' },
  { value: GalleryCategory.COMMUNITY, label: 'Community', icon: '🌍' },
  { value: GalleryCategory.OTHER, label: 'Other', icon: '📁' },
]

export default function GalleryFilters() {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''

  const handleCategoryChange = (category: string) => {
    const url = new URL(window.location.href)
    if (category) {
      url.searchParams.set('category', category)
    } else {
      url.searchParams.delete('category')
    }
    url.searchParams.delete('page') // Reset to first page on filter change
    window.history.pushState({}, '', url.toString())
    window.dispatchEvent(new Event('galleryFilterChange'))
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {categories.map((category) => {
        const isActive = currentCategory === category.value
        return (
          <button
            key={category.value}
            onClick={() => handleCategoryChange(category.value)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-300 ease-in-out
              ${isActive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-purple-300 hover:shadow-md'
              }
            `}
          >
            <span className="text-base">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        )
      })}
    </div>
  )
}
