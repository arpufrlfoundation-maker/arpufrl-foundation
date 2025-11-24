'use client'

import { useEffect } from 'react'
import { registerServiceWorker, useNetworkStatus } from '@/lib/pwa'

interface PWAProviderProps {
  children: React.ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const { isOnline, isOffline } = useNetworkStatus()

  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }

    // Show network status notifications
    if (isOffline) {
      showOfflineNotification()
    } else {
      hideOfflineNotification()
    }
  }, [isOffline])

  return (
    <>
      {children}

      {/* Network Status Indicator */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
              />
            </svg>
            <div>
              <p className="font-medium text-sm">You're offline</p>
              <p className="text-xs opacity-90">Some features may not be available</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function showOfflineNotification() {
  // Remove any existing notification
  const existing = document.getElementById('offline-notification')
  if (existing) {
    existing.remove()
  }

  // Create offline notification
  const notification = document.createElement('div')
  notification.id = 'offline-notification'
  notification.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50'
  notification.innerHTML = `
    <div class="flex items-center justify-center">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"></path>
      </svg>
      You're offline - Some features may not be available
    </div>
  `

  document.body.appendChild(notification)
}

function hideOfflineNotification() {
  const notification = document.getElementById('offline-notification')
  if (notification) {
    notification.remove()
  }
}