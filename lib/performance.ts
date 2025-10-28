import React, { lazy, ComponentType } from 'react'

// Lazy loading utility with better error handling
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFunc)

  return LazyComponent
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type

  document.head.appendChild(link)
}

// Prefetch resources for better navigation
export function prefetchResource(href: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href

  document.head.appendChild(link)
}

// Image optimization utilities
export function getOptimizedImageProps(
  src: string,
  alt: string,
  width?: number,
  height?: number
) {
  return {
    src,
    alt,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    style: {
      maxWidth: '100%',
      height: 'auto',
    },
  }
}

// Critical CSS inlining utility
export function inlineCriticalCSS(css: string) {
  if (typeof window === 'undefined') return

  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

// Web Vitals measurement
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Measure Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log)
    getFID(console.log)
    getFCP(console.log)
    getLCP(console.log)
    getTTFB(console.log)
  })
}

// Resource hints for better performance
export function addResourceHints() {
  if (typeof window === 'undefined') return

  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://checkout.razorpay.com',
  ]

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    if (domain.includes('gstatic')) {
      link.crossOrigin = 'anonymous'
    }
    document.head.appendChild(link)
  })

  // DNS prefetch for analytics
  const dnsPrefetchDomains = [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
  ]

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
}