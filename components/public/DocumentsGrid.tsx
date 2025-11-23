'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Image } from 'lucide-react'

interface Document {
  id: string
  title: string
  type: 'pdf' | 'image'
  path: string
  description: string
  category: string
}

const documents: Document[] = [
  {
    id: '1',
    title: 'ARPU Foundation Main Document',
    type: 'pdf',
    path: 'https://drive.google.com/file/d/1ReAnw5nYn0pmy5EA0B9gXj8jn5lEmAXs/preview',
    description: 'Official foundation registration document',
    category: 'Registration'
  },
  {
    id: '2',
    title: 'ARPU Future Rise Life Foundation',
    type: 'pdf',
    path: 'https://drive.google.com/file/d/1fZiGv1bSkwLuMUN-N4N1WwaP96CdbqiA/preview',
    description: 'Complete foundation documentation',
    category: 'Registration'
  },
  {
    id: '3',
    title: 'INC-13 Certificate',
    type: 'pdf',
    path: 'https://drive.google.com/file/d/1CVLr6H_pgD0JArB7j87hfWMgkZcUyhIW/preview',
    description: 'Incorporation certificate INC-13',
    category: 'Certificate'
  },
  {
    id: '4',
    title: 'SPICE Document Page 1',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895918/SPICE1_m4bmdr.jpg',
    description: 'SPICE registration document - Page 1',
    category: 'Registration'
  },
  {
    id: '5',
    title: 'SPICE Document Page 2',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895917/SPICE2_page-0001_w96xtg.jpg',
    description: 'SPICE registration document - Page 2',
    category: 'Registration'
  },
  {
    id: '6',
    title: 'SPICE Document Page 3',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895918/SPICE3_page-0002_xdf32x.jpg',
    description: 'SPICE registration document - Page 3',
    category: 'Registration'
  },
  {
    id: '7',
    title: 'SPICE Document Page 4',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895918/SPICE4_page-0003_l6khoe.jpg',
    description: 'SPICE registration document - Page 4',
    category: 'Registration'
  },
  {
    id: '8',
    title: 'Official Document 1',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895916/doc1_lwjy0n.jpg',
    description: 'Official documentation',
    category: 'Certificate'
  },
  {
    id: '9',
    title: 'Official Document 2',
    type: 'image',
    path: 'https://res.cloudinary.com/dyvv2furt/image/upload/v1763895917/doc2_moezsr.jpg',
    description: 'Official documentation',
    category: 'Certificate'
  }
]

export default function DocumentsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [viewDocument, setViewDocument] = useState<Document | null>(null)

  const categories = ['All', ...Array.from(new Set(documents.map(doc => doc.category)))]

  const filteredDocuments = selectedCategory === 'All'
    ? documents
    : documents.filter(doc => doc.category === selectedCategory)

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-indigo-50'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Documents Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {doc.type === 'pdf' ? (
                          <FileText className="w-8 h-8 text-red-500" />
                        ) : (
                          <Image className="w-8 h-8 text-blue-500" />
                        )}
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {doc.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {doc.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <a
                      href={doc.type === 'pdf' ? doc.path.replace('/preview', '/view') : doc.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Open in new tab"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    {doc.type === 'image' && (
                      <a
                        href={doc.path}
                        download
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No documents found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Document Viewer Modal */}
      {viewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setViewDocument(null)}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{viewDocument.title}</h3>
              <button
                onClick={() => setViewDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6">
              {viewDocument.type === 'pdf' ? (
                <iframe
                  src={`${viewDocument.path}#view=FitH&toolbar=1&navpanes=0`}
                  className="w-full h-[70vh] border-0"
                  title={viewDocument.title}
                  allow="fullscreen"
                />
              ) : (
                <div className="flex justify-center items-center bg-gray-50 p-4 rounded">
                  <img
                    src={viewDocument.path}
                    alt={viewDocument.title}
                    className="max-w-full h-auto"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <a
                href={viewDocument.type === 'pdf' ? viewDocument.path.replace('/preview', '/view') : viewDocument.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Open in New Tab
              </a>
              {viewDocument.type === 'image' && (
                <a
                  href={viewDocument.path}
                  download
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
              <button
                onClick={() => setViewDocument(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
