'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Loader2
} from 'lucide-react'
import { CloudinaryService } from '@/lib/cloudinary'

interface Blog {
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
  updatedBy?: string
}

interface BlogStats {
  totalBlogs: number
  publishedBlogs: number
  draftBlogs: number
  totalViews: number
}

interface BlogFilters {
  search: string
  status: string
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [uploading, setUploading] = useState(false)

  const [filters, setFilters] = useState<BlogFilters>({
    search: '',
    status: ''
  })

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: 'Success Stories',
    tags: '',
    published: true
  })

  const itemsPerPage = 15

  useEffect(() => {
    fetchBlogs()
  }, [filters, currentPage])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        admin: 'true',
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      const response = await fetch(`/api/blogs?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch blogs')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        let filteredBlogs = data.data.blogs || []
        
        // Apply filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredBlogs = filteredBlogs.filter((blog: Blog) => 
            blog.title.toLowerCase().includes(searchLower) ||
            blog.excerpt.toLowerCase().includes(searchLower) ||
            blog.slug.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters.status === 'published') {
          filteredBlogs = filteredBlogs.filter((blog: Blog) => blog.published)
        } else if (filters.status === 'draft') {
          filteredBlogs = filteredBlogs.filter((blog: Blog) => !blog.published)
        }
        
        setBlogs(filteredBlogs)
        setTotalPages(Math.ceil(filteredBlogs.length / itemsPerPage) || 1)
        calculateStats(filteredBlogs)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      setError('Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (blogList: Blog[]) => {
    const published = blogList.filter(b => b.published).length
    const totalViews = blogList.reduce((sum, b) => sum + b.views, 0)

    setStats({
      totalBlogs: blogList.length,
      publishedBlogs: published,
      draftBlogs: blogList.length - published,
      totalViews
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBlogs()
    setRefreshing(false)
  }

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)

      const method = selectedBlog ? 'PUT' : 'POST'
      const url = selectedBlog ? `/api/blogs/${selectedBlog.slug}` : '/api/blogs'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(t => t)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save blog')
      }

      setShowModal(false)
      setSelectedBlog(null)
      resetForm()
      await fetchBlogs()

    } catch (error) {
      console.error('Error saving blog:', error)
      setError(error instanceof Error ? error.message : 'Failed to save blog')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (blog: Blog) => {
    if (!confirm(`Delete "${blog.title}"?`)) return

    try {
      const response = await fetch(`/api/blogs/${blog.slug}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog')
      }

      await fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog:', error)
      setError('Failed to delete blog')
    }
  }

  const openModal = (blog?: Blog) => {
    if (blog) {
      setSelectedBlog(blog)
      setForm({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        featuredImage: blog.featuredImage,
        category: blog.category,
        tags: blog.tags.join(', '),
        published: blog.published
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      category: 'Success Stories',
      tags: '',
      published: true
    })
    setSelectedBlog(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await CloudinaryService.uploadProgramImage(file)
      if (result.success && result.url) {
        setForm(prev => ({ ...prev, featuredImage: result.url! }))
      } else {
        setError(result.error || 'Failed to upload image')
      }
    } catch (error) {
      setError('Failed to upload image')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Blog
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Posts', value: stats.totalBlogs, icon: '📝' },
            { label: 'Published', value: stats.publishedBlogs, icon: '✓' },
            { label: 'Drafts', value: stats.draftBlogs, icon: '📋' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{stat.icon} {stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blogs Yet</h3>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Create First Blog
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Views</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 truncate">{blog.title}</div>
                    <div className="text-sm text-gray-500">{blog.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{blog.category}</td>
                  <td className="px-6 py-4">
                    {blog.published ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Published</span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Draft</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{blog.views.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(blog)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{selectedBlog ? 'Edit Blog' : 'New Blog'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                <input type="text" placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({...p, slug: e.target.value}))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value}))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>Success Stories</option>
                  <option>Education</option>
                  <option>Healthcare</option>
                  <option>Community</option>
                  <option>Events</option>
                  <option>Impact</option>
                </select>
                <textarea placeholder="Excerpt (max 300 chars)" value={form.excerpt} onChange={(e) => setForm(p => ({...p, excerpt: e.target.value}))} maxLength={300} className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-20" />
                <textarea placeholder="Content (HTML allowed)" value={form.content} onChange={(e) => setForm(p => ({...p, content: e.target.value}))} className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-40" />
                <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm(p => ({...p, tags: e.target.value}))} className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                  {form.featuredImage && (
                    <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden">
                      <Image src={form.featuredImage} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <label className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm(p => ({...p, published: e.target.checked}))} className="w-4 h-4" />
                  <span className="font-medium text-gray-700">Publish</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
