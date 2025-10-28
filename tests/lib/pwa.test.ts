/**
 * @jest-environment jsdom
 */

import {
  registerServiceWorker,
  PWAInstaller,
  registerBackgroundSync,
  requestNotificationPermission,
  subscribeToPushNotifications
} from '@/lib/pwa'

// Mock service worker registration
const mockRegistration = {
  installing: null,
  waiting: null,
  active: null,
  addEventListener: jest.fn(),
  sync: {
    register: jest.fn(),
  },
  pushManager: {
    subscribe: jest.fn(),
  },
}

// Mock navigator
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    ready: Promise.resolve(mockRegistration),
  },
  writable: true,
})

describe('PWA Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()

      // Reset navigator mocks
      ; (navigator.serviceWorker.register as jest.Mock).mockResolvedValue(mockRegistration)

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('registerServiceWorker', () => {
    it('should register service worker successfully', async () => {
      const registration = await registerServiceWorker()

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      })
      expect(registration).toBe(mockRegistration)
    })

    it('should handle registration failure', async () => {
      const error = new Error('Registration failed')
        ; (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(error)

      const registration = await registerServiceWorker()

      expect(registration).toBeNull()
      expect(console.error).toHaveBeenCalledWith('Service Worker registration failed:', error)
    })

    it('should return null if service worker not supported', async () => {
      // Temporarily remove service worker support
      const originalServiceWorker = navigator.serviceWorker
      delete (navigator as any).serviceWorker

      const registration = await registerServiceWorker()

      expect(registration).toBeNull()
      expect(console.log).toHaveBeenCalledWith('Service Worker not supported')

        // Restore service worker
        ; (navigator as any).serviceWorker = originalServiceWorker
    })
  })

  describe('PWAInstaller', () => {
    let installer: PWAInstaller
    let mockBeforeInstallPrompt: any

    beforeEach(() => {
      mockBeforeInstallPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      }

      installer = new PWAInstaller()
    })

    it('should initialize correctly', () => {
      expect(installer).toBeInstanceOf(PWAInstaller)
      expect(installer.isAppInstallable()).toBe(false)
      expect(installer.isAppInstalled()).toBe(false)
    })

    it('should handle beforeinstallprompt event', () => {
      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt') as any
      Object.assign(event, mockBeforeInstallPrompt)

      window.dispatchEvent(event)

      expect(mockBeforeInstallPrompt.preventDefault).toHaveBeenCalled()
    })

    it('should handle app installed event', () => {
      const event = new Event('appinstalled')
      window.dispatchEvent(event)

      expect(installer.isAppInstalled()).toBe(true)
    })

    it('should detect standalone mode', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockReturnValue({
          matches: true,
        }),
      })

      const standaloneInstaller = new PWAInstaller()
      expect(standaloneInstaller.isAppInstalled()).toBe(true)
    })
  })

  describe('registerBackgroundSync', () => {
    it('should register background sync successfully', async () => {
      await registerBackgroundSync('test-sync')

      expect(mockRegistration.sync.register).toHaveBeenCalledWith('test-sync')
    })

    it('should handle sync registration failure', async () => {
      const error = new Error('Sync registration failed')
      mockRegistration.sync.register.mockRejectedValue(error)

      await registerBackgroundSync('test-sync')

      expect(console.error).toHaveBeenCalledWith('Background sync registration failed:', error)
    })

    it('should return early if service worker not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker
      delete (navigator as any).serviceWorker

      await registerBackgroundSync('test-sync')

      expect(mockRegistration.sync.register).not.toHaveBeenCalled()

        // Restore service worker
        ; (navigator as any).serviceWorker = originalServiceWorker
    })
  })

  describe('requestNotificationPermission', () => {
    beforeEach(() => {
      // Mock Notification API
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      })
    })

    it('should return granted if already granted', async () => {
      ; (global.Notification as any).permission = 'granted'

      const permission = await requestNotificationPermission()

      expect(permission).toBe('granted')
      expect(global.Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('should return denied if already denied', async () => {
      ; (global.Notification as any).permission = 'denied'

      const permission = await requestNotificationPermission()

      expect(permission).toBe('denied')
      expect(global.Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('should request permission if default', async () => {
      ; (global.Notification as any).permission = 'default'

      const permission = await requestNotificationPermission()

      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return denied if Notification not supported', async () => {
      delete (global as any).Notification

      const permission = await requestNotificationPermission()

      expect(permission).toBe('denied')
    })
  })

  describe('subscribeToPushNotifications', () => {
    beforeEach(() => {
      // Mock Notification API
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      })

      // Mock push subscription
      mockRegistration.pushManager.subscribe.mockResolvedValue({
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth',
        },
      })
    })

    it('should return null if service worker not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker
      delete (navigator as any).serviceWorker

      const subscription = await subscribeToPushNotifications()

      expect(subscription).toBeNull()

        // Restore service worker
        ; (navigator as any).serviceWorker = originalServiceWorker
    })

    it('should return null if push manager not supported', async () => {
      delete mockRegistration.pushManager

      const subscription = await subscribeToPushNotifications()

      expect(subscription).toBeNull()
    })

    it('should return null if notification permission denied', async () => {
      ; (global.Notification as any).permission = 'denied'

      const subscription = await subscribeToPushNotifications()

      expect(subscription).toBeNull()
    })

    it('should return null if VAPID key not configured', async () => {
      const subscription = await subscribeToPushNotifications()

      expect(subscription).toBeNull()
      expect(console.log).toHaveBeenCalledWith('VAPID public key not configured')
    })
  })
})