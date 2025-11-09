'use client'

// PWA utilities for service worker registration and app installation

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service Worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification()
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

// Show update notification
function showUpdateNotification() {
  if (typeof window === 'undefined') return

  const updateBanner = document.createElement('div')
  updateBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #059669;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <span>A new version is available!</span>
      <button
        onclick="window.location.reload()"
        style="
          margin-left: 12px;
          background: white;
          color: #059669;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        "
      >
        Update
      </button>
      <button
        onclick="this.parentElement.parentElement.remove()"
        style="
          margin-left: 8px;
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
        "
      >
        Later
      </button>
    </div>
  `
  document.body.appendChild(updateBanner)
}

// PWA Installation
export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isInstallable = false
  private isInstalled = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.isInstallable = true
      this.showInstallButton()
    })

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.hideInstallButton()
      console.log('PWA was installed')
    })

    // Check if already installed
    this.checkIfInstalled()
  }

  private checkIfInstalled() {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
    }

    // Check for iOS Safari standalone mode
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true
    }
  }

  public async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available')
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        this.deferredPrompt = null
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Error during installation:', error)
      return false
    }
  }

  public isAppInstallable(): boolean {
    return this.isInstallable && !this.isInstalled
  }

  public isAppInstalled(): boolean {
    return this.isInstalled
  }

  private showInstallButton() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-installable'))
  }

  private hideInstallButton() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  }
}

// Background sync for offline functionality
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      await (registration as any).sync.register(tag)
      console.log('Background sync registered:', tag)
    }
  } catch (error) {
    console.error('Background sync registration failed:', error)
  }
}

// Push notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    if (!('pushManager' in registration)) {
      console.log('Push messaging not supported')
      return null
    }

    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // You would need to replace this with your actual VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

    if (!vapidPublicKey) {
      console.log('VAPID public key not configured')
      return null
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })

    console.log('Push subscription successful:', subscription)
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Network status detection
export function useNetworkStatus() {
  if (typeof window === 'undefined') {
    return { isOnline: true, isOffline: false }
  }

  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}

// Add React import for the hook
import React from 'react'