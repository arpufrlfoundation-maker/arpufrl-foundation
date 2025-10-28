// Performance monitoring utilities
import { useCallback, useEffect, useRef } from 'react'

interface PerformanceMetric {
  loadTime: number
  renderTime: number
  networkLatency?: number
  timestamp: number
}

interface OptimizationSettings {
  enableAnimations: boolean
  prefetchContent: boolean
  enableLazyLoading: boolean
  maxConcurrentRequests: number
}

class PerformanceMonitor {
  private measurements: Map<string, number> = new Map()
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private optimizationSettings: OptimizationSettings

  constructor() {
    this.optimizationSettings = this.detectOptimizationSettings()
  }

  private detectOptimizationSettings(): OptimizationSettings {
    const isMobile = this.isMobileDevice()
    const isLowEnd = this.isLowEndDevice()

    return {
      enableAnimations: !isLowEnd && !this.prefersReducedMotion(),
      prefetchContent: !isMobile || !isLowEnd,
      enableLazyLoading: true,
      maxConcurrentRequests: isMobile ? 3 : 6
    }
  }

  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    // @ts-ignore - deviceMemory is experimental
    const deviceMemory = navigator.deviceMemory
    // @ts-ignore - hardwareConcurrency
    const cores = navigator.hardwareConcurrency

    return deviceMemory ? deviceMemory <= 2 : cores ? cores <= 2 : false
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  startMeasurement(key: string): void {
    this.measurements.set(key, performance.now())
  }

  endMeasurement(key: string): number {
    const startTime = this.measurements.get(key)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.measurements.delete(key)
    return duration
  }

  recordMetric(key: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const metrics = this.metrics.get(key)!
    metrics.push(metric)

    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  getOptimizationSettings(): OptimizationSettings {
    return { ...this.optimizationSettings }
  }

  getNetworkQuality(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator === 'undefined') return 'medium'

    // @ts-ignore - connection is experimental
    const connection = navigator.connection
    if (!connection) return 'medium'

    const effectiveType = connection.effectiveType
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow'
    if (effectiveType === '3g') return 'medium'
    return 'fast'
  }

  getMemoryUsage(): number | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) return null

    // @ts-ignore - memory is experimental
    const memory = performance.memory
    return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetric[]>([])

  const startMeasurement = useCallback((key: string) => {
    performanceMonitor.startMeasurement(`${componentName}-${key}`)
  }, [componentName])

  const endMeasurement = useCallback((key: string) => {
    return performanceMonitor.endMeasurement(`${componentName}-${key}`)
  }, [componentName])

  const recordMetric = useCallback((metric: PerformanceMetric) => {
    metricsRef.current.push(metric)
    performanceMonitor.recordMetric(componentName, metric)
  }, [componentName])

  return {
    startMeasurement,
    endMeasurement,
    recordMetric,
    metrics: metricsRef.current
  }
}

// Performance utilities
export const performanceUtils = {
  throttle: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0

    return ((...args: any[]) => {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }) as T
  },

  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout | null = null

    return ((...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  },

  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  isInViewport: (element: Element): boolean => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }
}