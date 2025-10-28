'use client'

import React, { Suspense, useRef } from 'react'
import { useIntersectionObserver } from '@/lib/performance'
import LoadingSpinner from './LoadingSpinner'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}

export default function LazyWrapper({
  children,
  fallback = <LoadingSpinner />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}: LazyWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref, {
    threshold,
    rootMargin,
  })

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        <div style={{ minHeight: '200px' }} className="flex items-center justify-center">
          {fallback}
        </div>
      )}
    </div>
  )
}