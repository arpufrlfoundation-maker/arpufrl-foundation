/**
 * @jest-environment jsdom
 */

import {
  lazyLoad,
  getOptimizedImageProps,
  preloadResource,
  prefetchResource,
  measureWebVitals,
  addResourceHints
} from '@/lib/performance'

// Mock web-vitals
jest.mock('web-vitals', () => ({
  getCLS: jest.fn((callback) => callback({ name: 'CLS', value: 0.1 })),
  getFID: jest.fn((callback) => callback({ name: 'FID', value: 50 })),
  getFCP: jest.fn((callback) => callback({ name: 'FCP', value: 1200 })),
  getLCP: jest.fn((callback) => callback({ name: 'LCP', value: 2000 })),
  getTTFB: jest.fn((callback) => callback({ name: 'TTFB', value: 300 })),
}))

describe('Performance Utilities', () => {
  beforeEach(() => {
    // Clear document head before each test
    document.head.innerHTML = ''

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('lazyLoad', () => {
    it('should create a lazy component', () => {
      const mockComponent = () => <div>Test Component</div>
      const importFunc = () => Promise.resolve({ default: mockComponent })

      const LazyComponent = lazyLoad(importFunc)

      expect(LazyComponent).toBeDefined()
      expect(typeof LazyComponent).toBe('object')
    })
  })

  describe('getOptimizedImageProps', () => {
    it('should return correct image props', () => {
      const props = getOptimizedImageProps('/test.jpg', 'Test image', 800, 600)

      expect(props.src).toBe('/test.jpg')
      expect(props.alt).toBe('Test image')
      expect(props.width).toBe(800)
      expect(props.height).toBe(600)
      expect(props.loading).toBe('lazy')
      expect(props.decoding).toBe('async')
      expect(props.style.maxWidth).toBe('100%')
      expect(props.style.height).toBe('auto')
    })

    it('should work without dimensions', () => {
      const props = getOptimizedImageProps('/test.jpg', 'Test image')

      expect(props.src).toBe('/test.jpg')
      expect(props.alt).toBe('Test image')
      expect(props.width).toBeUndefined()
      expect(props.height).toBeUndefined()
    })
  })

  describe('preloadResource', () => {
    it('should add preload link to document head', () => {
      preloadResource('/test.css', 'style', 'text/css')

      const links = document.head.querySelectorAll('link[rel="preload"]')
      expect(links).toHaveLength(1)

      const link = links[0] as HTMLLinkElement
      expect(link.href).toContain('/test.css')
      expect(link.as).toBe('style')
      expect(link.type).toBe('text/css')
    })

    it('should work without type parameter', () => {
      preloadResource('/test.js', 'script')

      const links = document.head.querySelectorAll('link[rel="preload"]')
      expect(links).toHaveLength(1)

      const link = links[0] as HTMLLinkElement
      expect(link.href).toContain('/test.js')
      expect(link.as).toBe('script')
      expect(link.type).toBe('')
    })
  })

  describe('prefetchResource', () => {
    it('should add prefetch link to document head', () => {
      prefetchResource('/next-page.html')

      const links = document.head.querySelectorAll('link[rel="prefetch"]')
      expect(links).toHaveLength(1)

      const link = links[0] as HTMLLinkElement
      expect(link.href).toContain('/next-page.html')
    })
  })

  describe('measureWebVitals', () => {
    it('should call web vitals functions', async () => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')

      measureWebVitals()

      // Wait for dynamic import to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(getCLS).toHaveBeenCalled()
      expect(getFID).toHaveBeenCalled()
      expect(getFCP).toHaveBeenCalled()
      expect(getLCP).toHaveBeenCalled()
      expect(getTTFB).toHaveBeenCalled()
    })
  })

  describe('addResourceHints', () => {
    it('should add preconnect links for external domains', () => {
      addResourceHints()

      const preconnectLinks = document.head.querySelectorAll('link[rel="preconnect"]')
      expect(preconnectLinks.length).toBeGreaterThan(0)

      const googleFonts = Array.from(preconnectLinks).find(
        link => (link as HTMLLinkElement).href === 'https://fonts.googleapis.com'
      )
      expect(googleFonts).toBeDefined()
    })

    it('should add dns-prefetch links for analytics domains', () => {
      addResourceHints()

      const dnsPrefetchLinks = document.head.querySelectorAll('link[rel="dns-prefetch"]')
      expect(dnsPrefetchLinks.length).toBeGreaterThan(0)

      const googleAnalytics = Array.from(dnsPrefetchLinks).find(
        link => (link as HTMLLinkElement).href === 'https://www.google-analytics.com'
      )
      expect(googleAoBeDefined()
    })

    it('should set crossOrigin for gstatic domain', () => {
      addResourceHints()

      const gstaticLink = Array.from(document.head.querySelectorAll('link[rel="preconnect"]')).find(
        link => (link as HTMLLinkElement).href === 'https://fonts.gstatic.com'
      ) as HTMLLinkElement

      expect(gstaticLink).toBeDefined()
      expect(gstaticLink.crossOrigin).toBe('anonymous')
    })
  })
})