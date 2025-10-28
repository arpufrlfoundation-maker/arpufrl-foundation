'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { InfoJSON, getFallbackContent } from './content-types';
import { performanceMonitor, usePerformanceMonitor } from './performance';

interface ContentContextType {
  content: InfoJSON;
  loading: boolean;
  error: string | null;
  reloadContent: () => Promise<void>;
  isUsingFallback: boolean;
  lastUpdated: Date | null;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

interface ContentProviderProps {
  children: ReactNode;
  initialContent?: InfoJSON;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({
  children,
  initialContent
}) => {
  const [content, setContent] = useState<InfoJSON>(initialContent || getFallbackContent());
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(!initialContent);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Start performance measurement
      performanceMonitor.startMeasurement('content-load');

      // Detect mobile device for optimization
      const isMobile = performanceMonitor.isMobileDevice();
      const optimizationSettings = performanceMonitor.getOptimizationSettings();

      // Build request URL with mobile optimization flag
      const url = new URL('/api/content', window.location.origin);
      if (isMobile) {
        url.searchParams.set('mobile', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Cache-Control': optimizationSettings.prefetchContent ? 'max-age=300' : 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const contentSource = response.headers.get('X-Content-Source');
      const errorType = response.headers.get('X-Error');
      const mobileOptimized = response.headers.get('X-Mobile-Optimized') === 'true';

      // End performance measurement
      const loadTime = performanceMonitor.endMeasurement('content-load');

      // Record network latency if available
      if (response.headers.get('Server-Timing')) {
        performanceMonitor.recordMetric('content-network', {
          loadTime,
          renderTime: 0,
          networkLatency: loadTime,
          timestamp: Date.now()
        });
      }

      // Update state based on response
      setContent(data);
      setIsUsingFallback(contentSource === 'fallback');
      setLastUpdated(new Date());

      // Set error message if using fallback content
      if (contentSource === 'fallback' && errorType) {
        const errorMessages = {
          'json-parse-error': 'Content file has invalid JSON format',
          'validation-error': 'Content structure validation failed',
          'file-read-error': 'Failed to read content file'
        };
        setError(errorMessages[errorType as keyof typeof errorMessages] || 'Unknown content loading error');
      }

      // Log performance metrics for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Content load performance:', {
          loadTime: `${loadTime.toFixed(2)}ms`,
          mobileOptimized,
          contentSource,
          networkQuality: performanceMonitor.getNetworkQuality()
        });
      }

    } catch (err) {
      console.error('Failed to load content:', err);

      // End measurement even on error
      performanceMonitor.endMeasurement('content-load');

      // Use fallback content on error
      setContent(getFallbackContent());
      setIsUsingFallback(true);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadContent = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  // Load content on mount if no initial content provided
  useEffect(() => {
    if (!initialContent) {
      loadContent();
    }
  }, [initialContent, loadContent]);

  // Set up periodic content refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadContent();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, loadContent]);

  const contextValue: ContentContextType = {
    content,
    loading,
    error,
    reloadContent,
    isUsingFallback,
    lastUpdated,
  };

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use content context
export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);

  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }

  return context;
};

// Progressive loading hook for content sections
export const useProgressiveContent = <T extends keyof InfoJSON>(
  sectionKey: T,
  priority: 'high' | 'medium' | 'low' = 'medium'
): {
  section: InfoJSON[T] | null;
  loading: boolean;
  error: string | null;
  loadSection: () => Promise<void>;
} => {
  const { content, loading: globalLoading, error: globalError } = useContent();
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [sectionLoaded, setSectionLoaded] = useState(false);

  const loadSection = useCallback(async () => {
    if (sectionLoaded || globalLoading) return;

    setSectionLoading(true);
    setSectionError(null);

    try {
      // Simulate progressive loading delay based on priority
      const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 300;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      setSectionLoaded(true);
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Failed to load section');
    } finally {
      setSectionLoading(false);
    }
  }, [sectionLoaded, globalLoading, priority]);

  useEffect(() => {
    if (!globalLoading && !sectionLoaded) {
      loadSection();
    }
  }, [globalLoading, sectionLoaded, loadSection]);

  return {
    section: sectionLoaded ? content[sectionKey] : null,
    loading: globalLoading || sectionLoading,
    error: globalError || sectionError,
    loadSection
  };
};

// Error boundary component for content loading
interface ContentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ContentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ContentErrorBoundary extends React.Component<
  ContentErrorBoundaryProps,
  ContentErrorBoundaryState
> {
  constructor(props: ContentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ContentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Content Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Content Loading Error
              </h2>
              <p className="text-gray-600 mb-6">
                We're having trouble loading the website content. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Higher-order component for content-dependent components
export function withContent<P extends object>(
  Component: React.ComponentType<P & { content: InfoJSON }>,
  SkeletonComponent?: React.ComponentType
) {
  return function ContentWrappedComponent(props: P) {
    const { content, loading } = useContent();
    const performanceHook = usePerformanceMonitor('ContentWrappedComponent');

    useEffect(() => {
      performanceHook.startMeasurement('content-render');
      return () => {
        performanceHook.endMeasurement('content-render');
      };
    }, [performanceHook]);

    if (loading) {
      if (SkeletonComponent) {
        return <SkeletonComponent />;
      }

      return (
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      );
    }

    return <Component {...props} content={content} />;
  };
}

// Hook for content sections with loading states
export const useContentSection = <T extends keyof InfoJSON>(
  sectionKey: T
): {
  section: InfoJSON[T];
  loading: boolean;
  error: string | null;
} => {
  const { content, loading, error } = useContent();

  return {
    section: content[sectionKey],
    loading,
    error,
  };
};