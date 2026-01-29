import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connectToDatabase } from '@/lib/db'
import { Blog } from '@/models/Blog'
import { generateBreadcrumbStructuredData } from '@/lib/seo'
import BlogContent from '@/components/public/BlogContent'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface BlogPageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata dynamically
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    await connectToDatabase()
    const blog = await Blog.findOne({ slug, published: true }).lean()
    
    if (!blog) return {}
    
    return {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      keywords: blog.tags,
      openGraph: {
        type: 'article',
        url: `https://arpufrl.org/blogs/${slug}`,
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt,
        images: [{ url: blog.featuredImage }]
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

// Generate static params for popular blogs
export async function generateStaticParams() {
  try {
    await connectToDatabase()
    const blogs = await Blog.find({ published: true })
      .select('slug')
      .sort({ views: -1 })
      .limit(10)
      .lean()
    
    return blogs.map((blog: any) => ({
      slug: blog.slug
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params
  
  try {
    await connectToDatabase()
    const blog = await Blog.findOne({ slug, published: true })
      .populate('author', 'name email profilePhoto')
      .lean()
    
    if (!blog) {
      notFound()
    }

    // Convert ObjectId to string for type compatibility
    const blogData = {
      ...blog,
      _id: blog._id.toString()
    }

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Blogs', url: '/blogs' },
      { name: blog.title, url: `/blogs/${slug}` },
    ]

    const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

    // Structured data for article
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.excerpt,
      image: blog.featuredImage,
      datePublished: blog.createdAt,
      dateModified: blog.updatedAt,
      author: {
        '@type': 'Person',
        name: 'ARPUFRL'
      },
      publisher: {
        '@type': 'Organization',
        name: 'ARPUFRL',
        url: 'https://arpufrl.org'
      }
    }

    return (
      <>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <BlogContent blog={blogData as any} />
        </Suspense>
      </>
    )
  } catch (error) {
    console.error('Error loading blog:', error)
    notFound()
  }
}
