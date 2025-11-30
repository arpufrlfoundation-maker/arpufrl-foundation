const CACHE_NAME = 'arpu-foundation-v4' // Updated version to force refresh
const STATIC_CACHE = 'arpu-static-v4'
const DYNAMIC_CACHE = 'arpu-dynamic-v4'

// Development mode: Minimal caching
const IS_DEVELOPMENT = true // Set to false for production

// Assets to cache immediately (only in production)
const STATIC_ASSETS = IS_DEVELOPMENT ? [] : [
  '/',
  '/about',
  '/programs',
  '/contact',
  '/offline',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/programs'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error)
      })
  )

  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and clearing old caches...')

  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Clear all caches for fresh start (development mode)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Service Worker: Clearing cache for fresh reload', cacheName)
            return caches.delete(cacheName)
          })
        )
      })
    ])
  )

  // Ensure the service worker takes control immediately
  return self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip external URLs (images from unsplash, cloudinary, google drive, etc.) - let browser handle directly
  const ownHostnames = ['arpufrl', 'localhost', 'vercel.app', '127.0.0.1']
  const isOwnDomain = ownHostnames.some(host => url.hostname.includes(host))
  
  if (!isOwnDomain) {
    // Don't intercept external URLs - let browser fetch directly
    return
  }

  // DEVELOPMENT MODE: Skip ALL caching, always fetch fresh
  if (IS_DEVELOPMENT) {
    event.respondWith(
      fetch(request).catch(() => {
        // Only fallback to offline page for navigation failures
        if (request.mode === 'navigate') {
          return new Response('Offline - Development Mode', { status: 503 })
        }
        throw new Error('Network error')
      })
    )
    return
  }

  // PRODUCTION MODE: Normal caching strategies below
  const isHTMLRequest = request.headers.get('accept')?.includes('text/html')
  const isAPIRequest = url.pathname.startsWith('/api/')
  const isDashboardRequest = url.pathname.startsWith('/dashboard')

  // Always fetch fresh for HTML pages, API routes, and dashboard
  if (isHTMLRequest || isAPIRequest || isDashboardRequest) {
    event.respondWith(fetch(request).catch(() => {
      // Only fallback to offline page for navigation failures
      if (request.mode === 'navigate') {
        return caches.match('/offline').then(response =>
          response || new Response('Offline', { status: 503 })
        )
      }
      throw new Error('Network error')
    }))
    return
  }

  // Handle API requests with network-first strategy (legacy endpoints)
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle static assets with cache-first strategy (images, fonts, etc.)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Default: network-first strategy (ensures fresh content)
  event.respondWith(fetch(request))
})

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', error)
    return new Response('Network error', { status: 408 })
  }
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)

    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline')
      if (offlineResponse) {
        return offlineResponse
      }
    }

    return new Response('Network error and no cache available', {
      status: 408,
      statusText: 'Network error'
    })
  }
}

// Navigation strategy with offline fallback
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('Navigation network failed, trying cache:', error)

    // Try to get from cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to offline page
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }

    // Last resort: basic offline message
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - ARPU Foundation</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Helper function to check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico')
}

// Background sync for offline donations (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-donation') {
    event.waitUntil(syncOfflineDonations())
  }
})

async function syncOfflineDonations() {
  try {
    // Get offline donations from IndexedDB
    const offlineDonations = await getOfflineDonations()

    for (const donation of offlineDonations) {
      try {
        const response = await fetch('/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donation)
        })

        if (response.ok) {
          // Remove from offline storage
          await removeOfflineDonation(donation.id)
        }
      } catch (error) {
        console.error('Failed to sync donation:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineDonations() {
  // Implementation would use IndexedDB to store offline donations
  return []
}

async function removeOfflineDonation(id) {
  // Implementation would remove donation from IndexedDB
  console.log('Removing offline donation:', id)
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/programs')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})