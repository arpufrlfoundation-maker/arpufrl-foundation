'use client'

import Link from 'next/link'
import { useContent } from '@/lib/content-provider'

export default function BlogSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-1/3 h-8 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
              <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-6">
                    <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
                    <div className="w-1/2 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content || !content.blog_section || !content.blog_section.posts || content.blog_section.posts.length === 0) {
    return null
  }

  const { blog_section } = content

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {blog_section.heading}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {blog_section.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blog_section.posts.map((post, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Blog Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-blue-400 text-6xl">📝</div>
                    </div>
                  )}
                </div>

                {/* Blog Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>

                  {post.link ? (
                    <Link
                      href={post.link}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read More
                      <span className="ml-1">→</span>
                    </Link>
                  ) : (
                    <span className="text-gray-500 text-sm">Coming Soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View All Blog Posts */}
          <div className="text-center mt-12">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}