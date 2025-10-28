'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = animate ? 'animate-pulse' : '';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={style}
    />
  );
};

// Hero Section Skeleton
export const HeroSectionSkeleton: React.FC = () => (
  <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
    <div className="text-center space-y-6 px-4 max-w-4xl mx-auto">
      {/* Title skeleton */}
      <div className="space-y-3">
        <Skeleton height="3rem" className="mx-auto max-w-2xl" />
        <Skeleton height="2rem" className="mx-auto max-w-xl" />
      </div>

      {/* Subtitle skeleton */}
      <Skeleton height="1.5rem" className="mx-auto max-w-lg" />

      {/* Motto skeleton */}
      <div className="flex justify-center space-x-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton width="3rem" height="3rem" rounded className="mx-auto mb-2" />
            <Skeleton width="4rem" height="1rem" />
          </div>
        ))}
      </div>

      {/* Buttons skeleton */}
      <div className="flex justify-center space-x-4 mt-8">
        <Skeleton width="8rem" height="3rem" className="rounded-lg" />
        <Skeleton width="8rem" height="3rem" className="rounded-lg" />
      </div>
    </div>
  </div>
);

// Navigation Skeleton
export const NavigationSkeleton: React.FC = () => (
  <nav className="bg-white shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Logo skeleton */}
        <div className="flex items-center space-x-3">
          <Skeleton width="2.5rem" height="2.5rem" rounded />
          <Skeleton width="12rem" height="1.5rem" />
        </div>

        {/* Desktop navigation skeleton */}
        <div className="hidden md:flex items-center space-x-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width="4rem" height="1rem" />
          ))}
          <div className="flex items-center space-x-3">
            <Skeleton width="4rem" height="1rem" />
            <Skeleton width="5rem" height="2rem" className="rounded-lg" />
          </div>
        </div>

        {/* Mobile menu button skeleton */}
        <div className="md:hidden">
          <Skeleton width="1.5rem" height="1.5rem" />
        </div>
      </div>
    </div>
  </nav>
);

// Content Section Skeleton
export const ContentSectionSkeleton: React.FC<{ showImage?: boolean }> = ({
  showImage = false
}) => (
  <div className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <div className={`grid ${showImage ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8 items-center`}>
        <div className="space-y-4">
          {/* Heading skeleton */}
          <Skeleton height="2.5rem" className="max-w-md" />

          {/* Text skeleton */}
          <div className="space-y-2">
            <Skeleton height="1rem" />
            <Skeleton height="1rem" className="max-w-5/6" />
            <Skeleton height="1rem" className="max-w-4/5" />
          </div>

          {/* Button skeleton */}
          <Skeleton width="8rem" height="2.5rem" className="rounded-lg mt-6" />
        </div>

        {showImage && (
          <div>
            <Skeleton height="20rem" className="rounded-lg" />
          </div>
        )}
      </div>
    </div>
  </div>
);

// Card Grid Skeleton
export const CardGridSkeleton: React.FC<{
  columns?: number;
  cards?: number;
  showImages?: boolean;
}> = ({
  columns = 3,
  cards = 6,
  showImages = true
}) => (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section heading skeleton */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton height="2.5rem" className="mx-auto max-w-md" />
          <Skeleton height="1rem" className="mx-auto max-w-lg" />
        </div>

        {/* Cards grid skeleton */}
        <div className={`grid md:grid-cols-${columns} gap-6`}>
          {[...Array(cards)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {showImages && (
                <Skeleton height="12rem" className="rounded-lg" />
              )}
              <Skeleton height="1.5rem" className="max-w-3/4" />
              <div className="space-y-2">
                <Skeleton height="0.875rem" />
                <Skeleton height="0.875rem" className="max-w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

// Donor Highlights Skeleton
export const DonorHighlightsSkeleton: React.FC = () => (
  <div className="donor-highlights-container overflow-hidden bg-gradient-to-r from-blue-50 to-green-50 py-4">
    {/* Header skeleton */}
    <div className="text-center mb-4 space-y-2">
      <Skeleton height="1.5rem" className="mx-auto max-w-48" />
      <Skeleton height="0.875rem" className="mx-auto max-w-64" />
    </div>

    {/* Scrolling donors skeleton */}
    <div className="flex space-x-6 animate-pulse">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="flex items-center space-x-3 bg-white rounded-lg shadow-sm px-4 py-3 min-w-max">
          <Skeleton width="2.5rem" height="2.5rem" rounded />
          <div className="space-y-1">
            <Skeleton width="6rem" height="0.875rem" />
            <Skeleton width="4rem" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Footer Skeleton
export const FooterSkeleton: React.FC = () => (
  <footer className="bg-gray-800 text-white py-12">
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Organization info skeleton */}
        <div className="space-y-4">
          <Skeleton height="1.5rem" className="max-w-32 bg-gray-600" />
          <div className="space-y-2">
            <Skeleton height="0.875rem" className="bg-gray-600" />
            <Skeleton height="0.875rem" className="max-w-3/4 bg-gray-600" />
          </div>
        </div>

        {/* Quick links skeleton */}
        <div className="space-y-4">
          <Skeleton height="1.25rem" className="max-w-24 bg-gray-600" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height="0.875rem" className="max-w-20 bg-gray-600" />
            ))}
          </div>
        </div>

        {/* Contact info skeleton */}
        <div className="space-y-4">
          <Skeleton height="1.25rem" className="max-w-20 bg-gray-600" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="0.875rem" className="max-w-32 bg-gray-600" />
            ))}
          </div>
        </div>

        {/* Social links skeleton */}
        <div className="space-y-4">
          <Skeleton height="1.25rem" className="max-w-28 bg-gray-600" />
          <div className="flex space-x-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} width="2rem" height="2rem" rounded className="bg-gray-600" />
            ))}
          </div>
        </div>
      </div>

      {/* Copyright skeleton */}
      <div className="border-t border-gray-700 mt-8 pt-8 text-center">
        <Skeleton height="0.875rem" className="mx-auto max-w-80 bg-gray-600" />
      </div>
    </div>
  </footer>
);

// Page Loading Skeleton (combines multiple skeletons)
export const PageLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen">
    <NavigationSkeleton />
    <HeroSectionSkeleton />
    <ContentSectionSkeleton showImage />
    <CardGridSkeleton columns={3} cards={3} />
    <DonorHighlightsSkeleton />
    <FooterSkeleton />
  </div>
);

export default Skeleton;