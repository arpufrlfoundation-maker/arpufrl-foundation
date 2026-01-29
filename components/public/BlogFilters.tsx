'use client'

import { useSearchParams } from 'next/navigation'

export default function BlogFilters() {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('tag') || ''

  const handleCategoryChange = (category: string) => {
    const url = new URL(window.location.href)
    if (category) {
      url.searchParams.set('category', category)
    } else {
      url.searchParams.delete('category')
    }
    url.searchParams.delete('page') // Reset to first page on filter change
    window.history.pushState({}, '', url.toString())
    window.dispatchEvent(new Event('blogFilterChange'))
  }

  const handleTagChange = (tag: string) => {
    const url = new URL(window.location.href)
    if (tag) {
      url.searchParams.set('tag', tag)
    } else {
      url.searchParams.delete('tag')
    }
    url.searchParams.delete('page')
    window.history.pushState({}, '', url.toString())
    window.dispatchEvent(new Event('blogFilterChange'))
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              currentCategory === ''
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            All Categories
          </button>
          {['Success Stories', 'Education', 'Healthcare', 'Community', 'Events', 'Impact'].map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                currentCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search articles..."
          onChange={(e) => {
            const url = new URL(window.location.href)
            if (e.target.value) {
              url.searchParams.set('search', e.target.value)
            } else {
              url.searchParams.delete('search')
            }
            url.searchParams.delete('page')
            window.history.pushState({}, '', url.toString())
            window.dispatchEvent(new Event('blogFilterChange'))
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  )
}
