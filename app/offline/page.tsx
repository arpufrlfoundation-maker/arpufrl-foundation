'use client'

import { generateMetadata } from '@/lib/seo'

// Note: metadata export doesn't work in client components, metadata should be in layout or parent
// export const metadata = generateMetadata({
//   title: 'Offline - ARPU Future Rise Life Foundation',
//   description: 'You are currently offline. Please check your internet connection.',
//   url: '/offline',
// })

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-8">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
        </div>

        {/* Offline Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          It looks like you've lost your internet connection. Please check your network settings and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-6"
        >
          Try Again
        </button>

        {/* Cached Content Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Available Offline
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Some content is available while you're offline:
          </p>

          <div className="space-y-2">
            <a
              href="/"
              className="block text-green-600 hover:text-green-700 text-sm font-medium"
            >
              → Homepage
            </a>
            <a
              href="/about"
              className="block text-green-600 hover:text-green-700 text-sm font-medium"
            >
              → About Us
            </a>
            <a
              href="/programs"
              className="block text-green-600 hover:text-green-700 text-sm font-medium"
            >
              → Our Programs
            </a>
            <a
              href="/contact"
              className="block text-green-600 hover:text-green-700 text-sm font-medium"
            >
              → Contact Information
            </a>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ARPU Future Rise Life Foundation
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supporting communities through education and healthcare
          </p>
        </div>
      </div>
    </div>
  )
}