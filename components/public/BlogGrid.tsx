'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'

interface Blog {
  _id: string
  title: string
  slug: string
  excerpt: string
  featuredImage: string
  category: string
  tags: string[]
  published: boolean
  views: number
  createdAt: string
  author?: {
    name: string
    email: string
    profilePhoto?: string
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BlogGrid() {
  const searchParams = useSearchParams()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const blogsPerPage = 9

  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true)
      const category = searchParams.get('category') || ''
      const tag = searchParams.get('tag') || ''
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: blogsPerPage.toString(),
      })
      
      if (category) {
        params.set('category', category)
      }
      
      if (tag) {
        params.set('tag', tag)
      }

      const response = await fetch(`/api/blogs?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch blogs')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setBlogs(data.data.blogs || [])
        setPagination(data.data.pagination || null)
      } else {
        setBlogs([])
        setPagination(null)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      setBlogs([])
      setPagination(null)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchParams])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  // Listen for filter changes
  useEffect(() => {
    const handleFilterChange = () => {
      setCurrentPage(1)
      fetchBlogs()
    }

    window.addEventListener('blogFilterChange', handleFilterChange)
    return () => window.removeEventListener('blogFilterChange', handleFilterChange)
  }, [fetchBlogs])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-video bg-gray-200" />
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (blogs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Blogs Found</h3>
        <p className="text-gray-600">
          We&apos;re working on new content. Check back soon for inspiring stories and insightful articles!
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <article key={blog._id} className="group">
            <Link href={`/blogs/${blog.slug}`}>
              <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Featured Image */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={blog.featuredImage}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                    <span className="text-sm font-semibold text-indigo-600">{blog.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(blog.createdAt)}
                    </div>
                    {blog.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {blog.author.name}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                    {blog.excerpt}
                  </p>

                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {blog.tags.length > 2 && (
                        <span className="text-xs text-gray-500 px-2 py-1">+{blog.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Read More Link */}
                  <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              transition-all duration-200
              ${pagination.hasPrev
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <span className="text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              transition-all duration-200
              ${pagination.hasNext
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
