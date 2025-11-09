// Mobile utilities and responsive design helpers
import { useState, useEffect, useRef, useCallback } from 'react'

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ResponsiveData {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenSize: ScreenSize
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

// Hook for responsive design
export const useResponsive = (): ResponsiveData => {
  const [responsiveData, setResponsiveData] = useState<ResponsiveData>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  })

  useEffect(() => {
    const updateResponsiveData = () => {
      const width = window.innerWidth

      let screenSize: ScreenSize
      if (width < 480) screenSize = 'xs'
      else if (width < 640) screenSize = 'sm'
      else if (width < 768) screenSize = 'md'
      else if (width < 1024) screenSize = 'lg'
      else screenSize = 'xl'

      const isMobile = width <= 768
      const isTablet = width > 768 && width <= 1024
      const isDesktop = width > 1024

      // Get safe area insets for devices with notches
      const safeAreaInsets = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0')
      }

      setResponsiveData({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        safeAreaInsets
      })
    }

    updateResponsiveData()
    window.addEventListener('resize', updateResponsiveData)

    return () => window.removeEventListener('resize', updateResponsiveData)
  }, [])

  return responsiveData
}

// Touch gesture utilities
interface TouchGestureData {
  isPressed: boolean
  startPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  deltaX: number
  deltaY: number
}

export const useTouchGestures = (elementRef: React.RefObject<HTMLElement>) => {
  const [gestureData, setGestureData] = useState<TouchGestureData>({
    isPressed: false,
    startPosition: null,
    currentPosition: null,
    deltaX: 0,
    deltaY: 0
  })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setGestureData(prev => ({
        ...prev,
        isPressed: true,
        startPosition: { x: touch.clientX, y: touch.clientY },
        currentPosition: { x: touch.clientX, y: touch.clientY }
      }))
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      setGestureData(prev => {
        if (!prev.startPosition) return prev

        const deltaX = touch.clientX - prev.startPosition.x
        const deltaY = touch.clientY - prev.startPosition.y

        return {
          ...prev,
          currentPosition: { x: touch.clientX, y: touch.clientY },
          deltaX,
          deltaY
        }
      })
    }

    const handleTouchEnd = () => {
      setGestureData(prev => ({
        ...prev,
        isPressed: false,
        startPosition: null,
        currentPosition: null,
        deltaX: 0,
        deltaY: 0
      }))
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef])

  return gestureData
}

// Touch utilities
export const touchUtils = {
  // Prevent default touch behaviors
  preventScroll: (e: TouchEvent) => {
    e.preventDefault()
  },

  // Get touch position
  getTouchPosition: (e: TouchEvent) => {
    const touch = e.touches[0] || e.changedTouches[0]
    return touch ? { x: touch.clientX, y: touch.clientY } : null
  },

  // Check if device supports touch
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  // Haptic feedback (if supported)
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }
}

// Mobile-specific CSS classes
export const mobileClasses = {
  // Touch-friendly button sizing
  touchButton: 'min-h-[44px] min-w-[44px]',

  // Prevent text selection on touch
  noSelect: 'select-none',

  // Smooth scrolling
  smoothScroll: 'scroll-smooth',

  // Mobile-optimized spacing
  mobileSpacing: 'px-4 sm:px-6 lg:px-8',

  // Safe area padding
  safeArea: 'pt-safe pb-safe pl-safe pr-safe',

  // Mobile-first responsive text
  responsiveText: 'text-sm sm:text-base lg:text-lg',

  // Mobile-optimized grid
  responsiveGrid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

// Viewport utilities
export const viewportUtils = {
  // Get viewport dimensions
  getViewportSize: () => ({
    width: window.innerWidth,
    height: window.innerHeight
  }),

  // Check if element is in viewport
  isInViewport: (element: Element, threshold = 0) => {
    const rect = element.getBoundingClientRect()
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight)
    const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth)

    return (
      rect.bottom >= threshold &&
      rect.right >= threshold &&
      rect.top <= viewHeight - threshold &&
      rect.left <= viewWidth - threshold
    )
  },

  // Get scroll position
  getScrollPosition: () => ({
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  })
}

// Device detection utilities
export const deviceUtils = {
  // Detect iOS
  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  },

  // Detect Android
  isAndroid: (): boolean => {
    return /Android/.test(navigator.userAgent)
  },

  // Detect mobile browser
  isMobileBrowser: (): boolean => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // Get device pixel ratio
  getPixelRatio: (): number => {
    return window.devicePixelRatio || 1
  },

  // Check if device supports hover
  supportsHover: (): boolean => {
    return window.matchMedia('(hover: hover)').matches
  }
}