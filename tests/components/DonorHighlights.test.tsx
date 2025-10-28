import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DonorHighlights } from '@/components/public/DonorHighlights';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock performance and mobile utilities
jest.mock('@/lib/performance', () => ({
  performanceMonitor: {
    getOptimizationSettings: jest.fn().mockReturnValue({
      enableAnimations: true,
      prefetchContent: false,
    }),
    isMobileDevice: jest.fn().mockReturnValue(false),
    getMemoryUsage: jest.fn().mockReturnValue(100),
  },
  usePerformanceMonitor: jest.fn().mockReturnValue({
    startMeasurement: jest.fn(),
    endMeasurement: jest.fn(),
  }),
  performanceUtils: {
    prefersReducedMotion: jest.fn().mockReturnValue(false),
    throttle: jest.fn((fn) => fn),
  },
}));

jest.mock('@/lib/mobile-utils', () => ({
  useResponsive: jest.fn().mockReturnValue({
    isMobile: false,
    isTablet: false,
    screenSize: 'lg',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  }),
  useTouchGestures: jest.fn().mockReturnValue({
    isPressed: false,
  }),
  touchUtils: {},
  mobileClasses: {
    touchButton: 'touch-button',
    noSelect: 'no-select',
    mobileSpacing: 'mobile-spacing',
    smoothScroll: 'smooth-scroll',
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('DonorHighlights Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockApiResponse = {
    success: true,
    data: {
      donors: [
        {
          id: 'donor1@example.com',
          name: 'John Doe',
          amount: 5000,
          isAnonymous: false,
          displayFormat: 'name_amount',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'donor2@example.com',
          name: 'Anonymous Donor',
          amount: 3000,
          isAnonymous: true,
          displayFormat: 'anonymous',
          createdAt: new Date('2024-01-10'),
        },
        {
          id: 'donor3@example.com',
          name: 'Jane Smith',
          amount: 2000,
          isAnonymous: false,
          displayFormat: 'name_amount',
          createdAt: new Date('2024-01-05'),
        },
      ],
      totalCount: 3,
      lastUpdated: new Date().toISOString(),
      privacyCompliant: true,
    },
  };

  it('should render loading skeleton initially', () => {
    mockFetch.mockImplementation(() =>
      new Promise(() => { }) // Never resolves to keep loading state
    );

    render(<DonorHighlights />);

    // Check for skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(document.querySelector('.donor-highlights-container')).toBeInTheDocument();
  });

  it('should display donor highlights after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Donor')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check amounts are displayed with proper formatting
    expect(screen.getByText('₹5,000')).toBeInTheDocument();
    expect(screen.getByText('₹3,000')).toBeInTheDocument();
    expect(screen.getByText('₹2,000')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load donor highlights')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch donor highlights:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should respect privacy settings for anonymous donors', async () => {
    const anonymousResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        donors: [
          {
            id: 'donor1@example.com',
            name: 'Anonymous Donor',
            amount: 5000,
            isAnonymous: true,
            displayFormat: 'anonymous',
            createdAt: new Date('2024-01-15'),
          },
          {
            id: 'donor2@example.com',
            name: 'John Doe',
            amount: 3000,
            isAnonymous: false,
            displayFormat: 'name_amount',
            createdAt: new Date('2024-01-10'),
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => anonymousResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('Anonymous Donor')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that anonymous donor shows heart icon instead of initial
    const heartIcons = document.querySelectorAll('svg');
    expect(heartIcons.length).toBeGreaterThan(0);

    // Check that non-anonymous donor shows first letter
    const johnInitial = screen.getByText('J');
    expect(johnInitial).toBeInTheDocument();
  });

  it('should set up automatic refresh interval', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Fast-forward 30 seconds to trigger refresh
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have made another API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle empty donor list', async () => {
    const emptyResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        donors: [],
        totalCount: 0,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('Be the first to make a donation!')).toBeInTheDocument();
    });

    // Should not crash with empty list
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should format donation amounts correctly', async () => {
    const largeAmountResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        donors: [
          {
            id: 'donor1@example.com',
            name: 'Big Donor',
            amount: 1234567,
            isAnonymous: false,
            displayFormat: 'name_amount',
            createdAt: new Date('2024-01-15'),
          },
          {
            id: 'donor2@example.com',
            name: 'Small Donor',
            amount: 100,
            isAnonymous: false,
            displayFormat: 'name_amount',
            createdAt: new Date('2024-01-10'),
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeAmountResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('₹12,34,567')).toBeInTheDocument();
      expect(screen.getByText('₹100')).toBeInTheDocument();
    });
  });

  it('should apply responsive CSS classes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check container has responsive classes
    const container = document.querySelector('.donor-highlights-container');
    expect(container).toHaveClass('overflow-hidden');
    expect(container).toHaveClass('bg-gradient-to-r');
    expect(container).toHaveClass('from-blue-50');
    expect(container).toHaveClass('to-green-50');
  });

  it('should handle HTTP error responses', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load donor highlights')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should cleanup interval on unmount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const { unmount } = render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Unmount component
    unmount();

    // Fast-forward time - should not make new API calls
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should display donor cards with correct structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check card structure
    const donorCards = screen.getAllByText(/₹/);
    expect(donorCards).toHaveLength(3); // One for each donor

    // Check that cards have the expected classes
    const cards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should handle real-time updates correctly', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock updated data for refresh
    const updatedResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        donors: [
          ...mockApiResponse.data.donors,
          {
            id: 'donor4@example.com',
            name: 'New Donor',
            amount: 1500,
            isAnonymous: false,
            displayFormat: 'name_amount',
            createdAt: new Date('2024-01-20'),
          },
        ],
        totalCount: 4,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedResponse,
    } as Response);

    // Trigger refresh
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(screen.getByText('New Donor')).toBeInTheDocument();
    });

    expect(screen.getByText('₹1,500')).toBeInTheDocument();
  });

  it('should handle mobile responsive design', async () => {
    // Mock mobile device
    const { useResponsive } = require('@/lib/mobile-utils');
    useResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      screenSize: 'xs',
      safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check mobile-specific elements
    expect(screen.getByText('Our Donors')).toBeInTheDocument(); // Mobile header
    expect(screen.getByText('Thank you for your support!')).toBeInTheDocument();
  });

  it('should respect privacy compliance settings', async () => {
    const nonCompliantResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        privacyCompliant: false,
      },
    };

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => nonCompliantResponse,
    } as Response);

    render(<DonorHighlights />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Received non-privacy-compliant donor data');
    consoleSpy.mockRestore();
  });
});