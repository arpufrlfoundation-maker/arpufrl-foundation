'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { User, Heart } from 'lucide-react'
import { performanceMonitor, usePerformanceMonitor, performanceUtils } from '@/lib/performance'
import { useResponsive, useTouchGestures, touchUtils, mobileClasses } from '@/lib/mobile-utils'

// Interface for donor highlight data (updated for privacy compliance)
interface DonorHighlight {
  id: string
  name: string
  amount?: number // Optional due to privacy settings
  isAnonymous: boolean
  createdAt?: Date // Optional due to privacy settings
  displayFormat: string
  donationCount?: number
}

// Interface for API response
interface DonorHighlightsResponse {
  success: boolean
  data: {
    donors: DonorHighlight[]
    totalCount: number
    lastUpdated: string
    privacyCompliant: boolean
  }
  error?: string
}

// Loading skeleton component
const DonorHighlightsSkeleton = () => (
  <div className="donor-highlights-container overflow-hidden bg-gradient-to-r from-blue-50 to-green-50 py-4">
    <div className="flex space-x-6 animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center space-x-3 bg-white rounded-lg shadow-sm px-4 py-3 min-w-max">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Individual donor card component (optimized for performance and mobile)
const DonorCard: React.FC<{ donor: DonorHighlight }> = React.memo(({ donor }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const { isMobile, isTablet } = useResponsive()
  const { isPressed } = useTouchGestures(cardRef as React.RefObject<HTMLElement>)

  const formatAmount = (amount: number): string => {
    // Use compact notation for mobile to save space
    if (isMobile && amount >= 100000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(amount)
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const renderDisplayContent = () => {
    // Mobile-responsive text sizes
    const nameSize = cardSize === 'compact' ? 'text-xs' : 'text-sm'
    const subSize = cardSize === 'compact' ? 'text-xs' : 'text-xs'

    switch (donor.displayFormat) {
      case 'name_only':
        return (
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-gray-800 ${nameSize} truncate`}>
              {donor.name}
            </p>
            <p className={`${subSize} text-gray-600 ${isMobile ? 'hidden' : ''}`}>
              Thank you for your support!
            </p>
          </div>
        )

      case 'amount_only':
        return (
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-gray-800 ${nameSize} truncate`}>
              Anonymous Donor
            </p>
            <p className={`${subSize} text-gray-600 font-medium truncate`}>
              {donor.amount ? formatAmount(donor.amount) : 'Generous donation'}
            </p>
          </div>
        )

      case 'anonymous':
        return (
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-gray-800 ${nameSize} truncate`}>
              Anonymous Donor
            </p>
            <p className={`${subSize} text-gray-600 truncate`}>
              {donor.donationCount && donor.donationCount > 1
                ? `${donor.donationCount} donations`
                : isMobile ? 'Thank you!' : 'Thank you for your support!'}
            </p>
          </div>
        )

      default: // 'name_amount'
        return (
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-gray-800 ${nameSize} truncate`}>
              {donor.name}
            </p>
            <p className={`${subSize} text-gray-600 font-medium truncate`}>
              {donor.amount ? formatAmount(donor.amount) : 'Generous donation'}
            </p>
          </div>
        )
    }
  }

  // Mobile-responsive sizing
  const cardSize = isMobile ? 'compact' : isTablet ? 'medium' : 'full'
  const avatarSize = cardSize === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = cardSize === 'compact' ? 'w-4 h-4' : 'w-5 h-5'
  const spacing = cardSize === 'compact' ? 'space-x-2' : 'space-x-3'
  const padding = cardSize === 'compact' ? 'px-3 py-2' : 'px-4 py-3'

  return (
    <div
      ref={cardRef}
      className={`
        flex items-center ${spacing} bg-white rounded-lg shadow-sm ${padding} min-w-max
        border border-gray-100 transition-all duration-200 will-change-transform
        ${mobileClasses.touchButton} ${mobileClasses.noSelect}
        ${isPressed ? 'scale-95 shadow-lg' : 'hover:shadow-md'}
        ${isMobile ? 'active:scale-95' : ''}
      `}
      style={{
        // Optimize for mobile performance
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)'
      }}
    >
      <div className={`
        ${avatarSize} bg-gradient-to-r from-blue-500 to-green-500 rounded-full
        flex items-center justify-center text-white font-bold
        ${cardSize === 'compact' ? 'text-xs' : 'text-sm'} flex-shrink-0
      `}>
        {donor.isAnonymous || donor.displayFormat === 'anonymous' || donor.displayFormat === 'amount_only' ? (
          <Heart className={iconSize} />
        ) : (
          <span>{donor.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {renderDisplayContent()}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return (
    prevProps.donor.id === nextProps.donor.id &&
    prevProps.donor.amount === nextProps.donor.amount &&
    prevProps.donor.displayFormat === nextProps.donor.displayFormat &&
    prevProps.donor.name === nextProps.donor.name
  )
})

// Error state component
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="donor-highlights-container bg-gradient-to-r from-blue-50 to-green-50 py-4">
    <div className="flex items-center justify-center space-x-4 px-4">
      <div className="flex items-center space-x-2 text-gray-600">
        <User className="w-5 h-5" />
        <span className="text-sm">Unable to load donor highlights</span>
      </div>
      <button
        onClick={onRetry}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
      >
        Retry
      </button>
    </div>
  </div>
)

// Main donor highlights component
export const DonorHighlights: React.FC = () => {
  const [donors, setDonors] = useState<DonorHighlight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animationKey, setAnimationKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [animationPaused, setAnimationPaused] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastFrameTime = useRef<number>(0)
  const performanceHook = usePerformanceMonitor('DonorHighlights')

  // Mobile responsiveness
  const { isMobile, isTablet, screenSize, safeAreaInsets } = useResponsive()
  const { isPressed } = useTouchGestures(containerRef as React.RefObject<HTMLElement>)

  // Optimized fetch function with performance monitoring
  const fetchDonors = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setError(null)
        performanceHook.startMeasurement('donor-fetch')
      } else {
        setIsRefreshing(true)
      }

      // Get optimization settings for request
      const optimizationSettings = performanceMonitor.getOptimizationSettings()
      const isMobile = performanceMonitor.isMobileDevice()

      // Adjust limit based on device capabilities
      const limit = isMobile ? 20 : optimizationSettings.enableAnimations ? 30 : 15

      const response = await fetch(`/api/donors/highlights?limit=${limit}`, {
        // Add cache busting for real-time updates
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: DonorHighlightsResponse = await response.json()

      if (data.success && data.data.donors) {
        // Verify privacy compliance
        if (!data.data.privacyCompliant) {
          console.warn('Received non-privacy-compliant donor data')
        }

        // Only update if data has actually changed (performance optimization)
        const newDataHash = JSON.stringify(data.data.donors.map(d => ({
          id: d.id,
          amount: d.amount,
          displayFormat: d.displayFormat
        })))
        const currentDataHash = JSON.stringify(donors.map(d => ({
          id: d.id,
          amount: d.amount,
          displayFormat: d.displayFormat
        })))

        if (newDataHash !== currentDataHash) {
          setDonors(data.data.donors)
          setLastUpdated(data.data.lastUpdated)
          // Reset animation when data changes
          setAnimationKey(prev => prev + 1)
          setCurrentPage(0) // Reset pagination
        }
      } else {
        throw new Error(data.error || 'Failed to fetch donor data')
      }

      if (!isBackgroundRefresh) {
        performanceHook.endMeasurement('donor-fetch')
      }
    } catch (error) {
      console.error('Failed to fetch donor highlights:', error)
      if (!isBackgroundRefresh) {
        setError(error instanceof Error ? error.message : 'Unknown error')
        performanceHook.endMeasurement('donor-fetch')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [donors, performanceHook])

  useEffect(() => {
    // Initial load
    fetchDonors()

    // Set up real-time updates with polling
    const updateInterval = setInterval(() => {
      fetchDonors(true) // Background refresh
    }, 30000) // Update every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(updateInterval)
  }, [])

  // Add intersection observer for performance optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Add visibility change listener for performance optimization
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if (document.hidden || !isVisible) {
        // Page is hidden or component not visible, clear interval to save resources
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } else {
        // Page is visible and component is in view, restart updates
        fetchDonors(true)
        intervalId = setInterval(() => {
          fetchDonors(true)
        }, 30000)
      }
    }

    // Only start polling if component is visible
    if (isVisible && !document.hidden) {
      intervalId = setInterval(() => {
        fetchDonors(true)
      }, 30000)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isVisible])

  const handleRetry = () => {
    setIsLoading(true)
    fetchDonors()
  }

  // Memoized performance optimizations - MUST be before any conditional returns
  const optimizationSettings = useMemo(() =>
    performanceMonitor.getOptimizationSettings(),
    [animationKey]
  )

  // Mobile-responsive virtualized donor display with performance optimization
  const displaySettings = useMemo(() => {
    const prefersReducedMotion = performanceUtils.prefersReducedMotion()

    // Adjust display count based on screen size and device capabilities
    let maxDisplayDonors: number
    let animationDuration: number
    let itemsPerPage: number
    let cardSpacing: number

    if (isMobile) {
      maxDisplayDonors = 15
      animationDuration = prefersReducedMotion ? 0 : 25
      itemsPerPage = 3
      cardSpacing = 12 // Compact spacing for mobile
    } else if (isTablet) {
      maxDisplayDonors = 20
      animationDuration = prefersReducedMotion ? 0 : 20
      itemsPerPage = 4
      cardSpacing = 16
    } else {
      maxDisplayDonors = 30
      animationDuration = prefersReducedMotion ? 0 : 15
      itemsPerPage = 5
      cardSpacing = 24
    }

    // Further reduce animation speed on low-end devices
    if (!optimizationSettings.enableAnimations) {
      animationDuration = 0
    }

    const displayDonors = donors.slice(0, maxDisplayDonors)

    return { displayDonors, animationDuration, itemsPerPage, cardSpacing }
  }, [donors, isMobile, isTablet, optimizationSettings.enableAnimations, animationKey])

  if (isLoading) {
    return <DonorHighlightsSkeleton />
  }

  if (error) {
    return <ErrorState onRetry={handleRetry} />
  }

  if (donors.length === 0) {
    return (
      <div className="donor-highlights-container bg-gradient-to-r from-blue-50 to-green-50 py-4">
        <div className="flex items-center justify-center px-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Heart className="w-5 h-5" />
            <span className="text-sm">Be the first to make a donation!</span>
          </div>
        </div>
      </div>
    )
  }

  // Destructure displaySettings
  const { displayDonors, animationDuration, itemsPerPage, cardSpacing } = displaySettings

  // Duplicate donors for seamless scrolling (performance optimized)
  const duplicatedDonors = useMemo(() => {
    if (displayDonors.length === 0) return []

    // Only duplicate if we have enough donors to justify it
    if (displayDonors.length < 5) {
      return [...displayDonors, ...displayDonors, ...displayDonors] // Triple for short lists
    }

    return [...displayDonors, ...displayDonors] // Double for longer lists
  }, [displayDonors])

  // Auto-pagination for large donor lists
  useEffect(() => {
    if (donors.length <= itemsPerPage) return

    const totalPages = Math.ceil(donors.length / itemsPerPage)
    const pageInterval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages)
    }, animationDuration * 1000) // Change page after each animation cycle

    return () => clearInterval(pageInterval)
  }, [donors.length, itemsPerPage, animationDuration])

  // Performance-optimized animation frame management
  useEffect(() => {
    if (!isVisible || !optimizationSettings.enableAnimations) return

    let frameCount = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      if (currentTime - lastFrameTime.current >= frameInterval) {
        frameCount++
        lastFrameTime.current = currentTime

        // Monitor performance every 60 frames (1 second at 60fps)
        if (frameCount % 60 === 0) {
          const memoryUsage = performanceMonitor.getMemoryUsage()
          if (memoryUsage && memoryUsage > 150) { // 150MB threshold
            console.warn('High memory usage detected, consider reducing animation complexity')
          }
        }
      }

      if (!animationPaused) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible, optimizationSettings.enableAnimations, animationPaused])

  // Throttled scroll handler for performance
  const handleMouseEnter = useMemo(
    () => performanceUtils.throttle(() => {
      if (optimizationSettings.enableAnimations) {
        setAnimationPaused(true)
      }
    }, 100),
    [optimizationSettings.enableAnimations]
  )

  const handleMouseLeave = useMemo(
    () => performanceUtils.throttle(() => {
      setAnimationPaused(false)
    }, 100),
    []
  )

  return (
    <div
      ref={containerRef}
      className={`
        donor-highlights-container overflow-hidden bg-gradient-to-r from-blue-50 to-green-50
        ${isMobile ? 'py-3' : 'py-4'} relative ${mobileClasses.mobileSpacing}
        ${mobileClasses.noSelect} ${mobileClasses.touchButton}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // Safe area support for devices with notches
        paddingTop: isMobile ? `max(1rem, ${safeAreaInsets.top}px)` : undefined,
        paddingBottom: isMobile ? `max(1rem, ${safeAreaInsets.bottom}px)` : undefined,
        // Performance optimization
        contain: 'layout style paint'
      }}
    >
      {/* Mobile-responsive Header */}
      <div className={`text-center ${isMobile ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center justify-center space-x-2 mb-1">
          <h3 className={`font-semibold text-gray-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {isMobile ? 'Our Donors' : 'Our Amazing Donors'}
          </h3>
          {isRefreshing && (
            <div className={`border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${isMobile ? 'w-3 h-3' : 'w-4 h-4'
              }`}></div>
          )}
        </div>
        <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {isMobile ? 'Thank you for your support!' : 'Thank you for your generous support!'}
        </p>
        {lastUpdated && !isMobile && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}

        {/* Performance indicator (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-1">
            Showing {displayDonors.length} of {donors.length} donors
            {donors.length > itemsPerPage && ` (Page ${currentPage + 1})`}
          </div>
        )}
      </div>

      {/* Scrolling donors with mobile-responsive performance optimization */}
      <div className="relative">
        <div
          key={`${animationKey}-${currentPage}`}
          className={`
            flex ${cardSpacing} whitespace-nowrap ${mobileClasses.smoothScroll}
            ${optimizationSettings.enableAnimations && !performanceUtils.prefersReducedMotion()
              ? 'animate-scroll'
              : 'animate-none'
            }
          `}
          style={{
            animationDuration: optimizationSettings.enableAnimations
              ? `${animationDuration}s`
              : undefined,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationPlayState: animationPaused ? 'paused' : 'running',
            transform: !optimizationSettings.enableAnimations
              ? 'translateX(0)'
              : undefined,
            // Use GPU acceleration for better performance
            willChange: optimizationSettings.enableAnimations ? 'transform' : 'auto',
            // Mobile-specific optimizations
            backfaceVisibility: 'hidden',
            perspective: '1000px',
            // Safe area padding for mobile devices with notches
            paddingLeft: isMobile ? `${safeAreaInsets.left}px` : undefined,
            paddingRight: isMobile ? `${safeAreaInsets.right}px` : undefined
          }}
        >
          {duplicatedDonors.map((donor, index) => (
            <DonorCard
              key={`${donor.id}-${index}-${currentPage}`}
              donor={donor}
            />
          ))}
        </div>
      </div>

      {/* Mobile-responsive gradient overlays for smooth edges */}
      <div className={`
        absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none
        ${isMobile ? 'w-4' : 'w-8'}
      `}></div>
      <div className={`
        absolute right-0 top-0 bottom-0 bg-gradient-to-l from-green-50 to-transparent pointer-events-none
        ${isMobile ? 'w-4' : 'w-8'}
      `}></div>

      {/* Pagination indicators for large lists */}
      {donors.length > itemsPerPage && (
        <div className="flex justify-center mt-2 space-x-1">
          {Array.from({ length: Math.ceil(donors.length / itemsPerPage) }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === currentPage ? 'bg-blue-500' : 'bg-gray-300'
                }`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation-name: scroll;
        }

        /* Optimized animation for 60fps with mobile support */
        .animate-scroll {
          backface-visibility: hidden;
          perspective: 1000px;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          -webkit-backface-visibility: hidden;
        }

        /* Touch-friendly interactions */
        .donor-highlights-container:hover .animate-scroll,
        .donor-highlights-container:active .animate-scroll {
          animation-play-state: paused;
        }

        /* Mobile-first responsive adjustments */
        @media (max-width: 480px) {
          .donor-highlights-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }

        @media (max-width: 640px) {
          .donor-highlights-container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        @media (max-width: 768px) {
          .animate-scroll {
            /* Slower animation on mobile for better readability */
            animation-duration: 1.2em !important;
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll {
            animation: none !important;
            transform: translateX(0) !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .donor-highlights-container {
            background: white;
            border: 2px solid black;
          }
        }

        /* Performance optimizations */
        .donor-highlights-container {
          contain: layout style paint;
          -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
        }

        /* Safe area support for devices with notches */
        @supports (padding: max(0px)) {
          .donor-highlights-container {
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .donor-highlights-container {
            background: linear-gradient(to right, #1e3a8a, #166534);
          }
        }
      `}</style>
    </div>
  )
}

export default DonorHighlights