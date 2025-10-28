import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ContentProvider, useContent, ContentErrorBoundary } from '@/lib/content-provider';
import { getFallbackContent } from '@/lib/content-types';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock performance monitor
jest.mock('@/lib/performance', () => ({
  performanceMonitor: {
    startMeasurement: jest.fn(),
    endMeasurement: jest.fn().mockReturnValue(100),
    isMobileDevice: jest.fn().mockReturnValue(false),
    getOptimizationSettings: jest.fn().mockReturnValue({ prefetchContent: false }),
    recordMetric: jest.fn(),
    getNetworkQuality: jest.fn().mockReturnValue('good'),
  },
  usePerformanceMonitor: jest.fn().mockReturnValue({
    startMeasurement: jest.fn(),
    endMeasurement: jest.fn(),
  }),
}));

// Test component that uses content
const TestComponent: React.FC = () => {
  const { content, loading, error, isUsingFallback } = useContent();

  if (loading) return <div data-testid="loading">Loading...</div>;

  return (
    <div data-testid="content">
      <h1>{content.organization.name}</h1>
      <p data-testid="fallback-indicator">{isUsingFallback ? 'Using fallback' : 'Using live content'}</p>
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
};

describe('ContentProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide initial content when provided', () => {
    const initialContent = getFallbackContent();
    initialContent.organization.name = 'Initial Test Organization';

    render(
      <ContentProvider initialContent={initialContent}>
        <TestComponent />
      </ContentProvider>
    );

    expect(screen.getByText('Initial Test Organization')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-indicator')).toHaveTextContent('Using live content');
  });

  it('should load content from API when no initial content provided', async () => {
    const mockContent = {
      organization: {
        name: 'API Test Organization',
        email: 'test@example.com',
      },
      navigation: [],
      hero_section: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        buttons: [],
      },
      highlight_cards: [],
      mission_section: {
        heading: 'Test Mission',
        text: 'Test mission text',
      },
      call_to_action: {
        heading: 'Test CTA',
        text: 'Test CTA text',
      },
      achievements_section: {
        heading: 'Test Achievements',
        text: 'Test achievements text',
        cards: [],
      },
      about_section: {
        heading: 'Test About',
        text: 'Test about text',
      },
      blog_section: {
        heading: 'Test Blog',
        posts: [],
      },
      team_section: {
        heading: 'Test Team',
        members: [],
      },
      footer: {
        quick_links: [],
        contact: {
          email: 'test@example.com',
        },
        copyright: '© 2025 Test Organization',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockContent,
      headers: new Headers({
        'X-Content-Source': 'file',
        'X-Mobile-Optimized': 'false',
      }),
    } as Response);

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    // Initially should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('API Test Organization')).toBeInTheDocument();
    });

    expect(screen.getByTestId('fallback-indicator')).toHaveTextContent('Using live content');
  });

  it('should use fallback content when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument();
    });

    expect(screen.getByTestId('fallback-indicator')).toHaveTextContent('Using fallback');
    expect(screen.getByTestId('error')).toHaveTextContent('Network error');
  });

  it('should handle fallback content from API response', async () => {
    const fallbackContent = getFallbackContent();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fallbackContent,
      headers: new Headers({
        'X-Content-Source': 'fallback',
        'X-Error': 'json-parse-error',
        'X-Mobile-Optimized': 'false',
      }),
    } as Response);

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument();
    });

    expect(screen.getByTestId('fallback-indicator')).toHaveTextContent('Using fallback');
    expect(screen.getByTestId('error')).toHaveTextContent('Content file has invalid JSON format');
  });

  it('should handle HTTP errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument();
    });

    expect(screen.getByTestId('fallback-indicator')).toHaveTextContent('Using fallback');
    expect(screen.getByTestId('error')).toHaveTextContent('HTTP error! status: 500');
  });

  it('should optimize requests for mobile devices', async () => {
    // Mock mobile device detection
    const { performanceMonitor } = require('@/lib/performance');
    performanceMonitor.isMobileDevice.mockReturnValue(true);

    const mockContent = getFallbackContent();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockContent,
      headers: new Headers({
        'X-Content-Source': 'file',
        'X-Mobile-Optimized': 'true',
      }),
    } as Response);

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument();
    });

    // Verify mobile optimization was requested
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('mobile=true'),
      expect.any(Object)
    );
  });

  it('should refresh content periodically', async () => {
    const mockContent = getFallbackContent();
    mockContent.organization.name = 'Refreshed Organization';

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockContent,
      headers: new Headers({
        'X-Content-Source': 'file',
        'X-Mobile-Optimized': 'false',
      }),
    } as Response);

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Refreshed Organization')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Fast-forward 5 minutes to trigger refresh
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    // Verify refresh was triggered
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should not refresh while loading', async () => {
    // Mock a slow initial load
    mockFetch.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: async () => getFallbackContent(),
          headers: new Headers({
            'X-Content-Source': 'file',
            'X-Mobile-Optimized': 'false',
          }),
        } as Response), 1000)
      )
    );

    render(
      <ContentProvider>
        <TestComponent />
      </ContentProvider>
    );

    // Fast-forward 5 minutes while still loading
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    // Should only have one fetch call (the initial one)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('ContentErrorBoundary', () => {
  // Mock console.error to avoid noise in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  const ThrowError: React.FC = () => {
    throw new Error('Test error');
  };

  it('should catch errors and display fallback UI', () => {
    render(
      <ContentErrorBoundary>
        <ThrowError />
      </ContentErrorBoundary>
    );

    expect(screen.getByText('Content Loading Error')).toBeInTheDocument();
    expect(screen.getByText(/We're having trouble loading the website content/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
  });

  it('should display custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

    render(
      <ContentErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ContentErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('should render children when no error occurs', () => {
    render(
      <ContentErrorBoundary>
        <div data-testid="normal-content">Normal content</div>
      </ContentErrorBoundary>
    );

    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});

describe('useContent hook', () => {
  it('should throw error when used outside ContentProvider', () => {
    const TestComponentOutsideProvider: React.FC = () => {
      useContent();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useContent must be used within a ContentProvider');

    console.error = originalError;
  });
});