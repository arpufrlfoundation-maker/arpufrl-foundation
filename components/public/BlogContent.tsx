'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, Eye, Share2, ArrowLeft } from 'lucide-react'

interface Author {
  name: string
  email: string
  profilePhoto?: string
}

interface BlogContentProps {
  blog: {
    _id: string
    title: string
    slug: string
    excerpt: string
    content: string
    featuredImage: string
    category: string
    tags: string[]
    published: boolean
    views: number
    createdAt: string
    updatedAt: string
    author?: Author
  }
}

export default function BlogContent({ blog }: BlogContentProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleShare = (platform: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://arpufrl.org'}/blogs/${blog.slug}`
    const title = blog.title
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    }
    
    const shareUrl = shareUrls[platform as keyof typeof shareUrls]
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Category Badge */}
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
              {blog.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-gray-200 mb-8">
            {/* Author */}
            {blog.author && (
              <div className="flex items-center gap-3">
                {blog.author.profilePhoto ? (
                  <Image
                    src={blog.author.profilePhoto}
                    alt={blog.author.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {blog.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{blog.author.name}</p>
                  <p className="text-sm text-gray-600">{blog.author.email}</p>
                </div>
              </div>
            )}

            {/* Publish Date */}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(blog.createdAt)}</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-2 text-gray-600">
              <Eye className="w-5 h-5" />
              <span>{blog.views.toLocaleString()} views</span>
            </div>

            {/* Share Button */}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Share:</span>
              <button
                onClick={() => handleShare('facebook')}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                title="Share on Facebook"
              >
                <span className="text-xs font-bold">f</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
                title="Share on Twitter"
              >
                <span className="text-xs font-bold">𝕏</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition-colors"
                title="Share on LinkedIn"
              >
                <span className="text-xs font-bold">in</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                title="Share on WhatsApp"
              >
                <span className="text-xs font-bold">W</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 shadow-lg">
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blogs?tag=${encodeURIComponent(tag)}`}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Support Our Mission
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Help us create more positive impact in communities across India. Your support makes all the difference.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/donate"
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg"
            >
              Donate Now
            </Link>
            <Link
              href="/volunteer"
              className="px-8 py-3 bg-indigo-700 text-white font-semibold rounded-full hover:bg-indigo-800 transition-colors border-2 border-white"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            More Articles
          </h2>
          <div className="text-center">
            <Link
              href={`/blogs?category=${encodeURIComponent(blog.category)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors"
            >
              Explore {blog.category} Articles
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
