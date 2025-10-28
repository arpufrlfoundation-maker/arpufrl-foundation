import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import CoordinatorDashboard from '@/app/dashboard/coordinator/page'
import SubCoordinatorManagement from '@/components/dashboard/SubCoordinatorManagement'
import CoordinatorHierarchyTree from '@/components/dashboard/CoordinatorHierarchyTree'
import ReferralAnalytics from '@/components/dashboard/ReferralAnalytics'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}))

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('Coordinator Portal Components', () => {
  const mockCoordinatorSession = {
    user: {
      id: 'coord123',
      name: 'Test Coordinator',
      email: 'coordinator@test.com',
      role: 'COORDINATOR'
    }
  }

  const mockSubCoordinatorSession = {
    user: {
      id: 'sub123',
      name: 'Test Sub-Coordinator',
      email: 'sub@test.com',
      role: 'SUB_COORDINATOR'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CoordinatorDashboard', () => {
    it('renders coordinator dashboard with all sections for coordinator role', async () => {
      mockUseSession.mockReturnValue({
        data: mockCoordinatorSession,
        status: 'authenticated'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: {
            id: 'ref123',
            code: 'COORD-MUM-01',
            totalDonations: 5,
            totalAmount: 10000
          }
        })
      })

      render(<CoordinatorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Coordinator!')).toBeInTheDocument()
      })

      expect(screen.getByText(/Manage your coordination activities/)).toBeInTheDocument()
    })

    it('renders sub-coordinator dashboard without management sections', async () => {
      mockUseSession.mockReturnValue({
        data: mockSubCoordinatorSession,
        status: 'authenticated'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: {
            id: 'ref456',
            code: 'SUB-MUM-01',
            totalDonations: 2,
            totalAmount: 3000
          }
        })
      })

      render(<CoordinatorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Sub-Coordinator!')).toBeInTheDocument()
      })

      expect(screen.getByText(/Track your sub-coordination activities/)).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(<CoordinatorDashboard />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('handles referral code fetch error', async () => {
      mockUseSession.mockReturnValue({
        data: mockCoordinatorSession,
        status: 'authenticated'
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<CoordinatorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText(/Failed to load referral code/)).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('SubCoordinatorManagement', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockCoordinatorSession,
        status: 'authenticated'
      })
    })

    it('renders sub-coordinator management interface', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coordinators: [
            {
              id: 'sub1',
              name: 'Sub Coordinator 1',
              email: 'sub1@test.com',
              status: 'ACTIVE',
              referralCode: {
                code: 'SUB-MUM-01',
                totalDonations: 3,
                totalAmount: 5000
              }
            }
          ]
        })
      })

      render(<SubCoordinatorManagement />)

      await waitFor(() => {
        expect(screen.getByText('Sub-Coordinator Management')).toBeInTheDocument()
        expect(screen.getByText('Add Sub-Coordinator')).toBeInTheDocument()
      })
    })

    it('shows empty state when no sub-coordinators exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coordinators: []
        })
      })

      render(<SubCoordinatorManagement />)

      await waitFor(() => {
        expect(screen.getByText('No Sub-Coordinators Yet')).toBeInTheDocument()
        expect(screen.getByText('Add Your First Sub-Coordinator')).toBeInTheDocument()
      })
    })

    it('opens create form when add button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ coordinators: [] })
      })

      render(<SubCoordinatorManagement />)

      await waitFor(() => {
        const addButton = screen.getByText('Add Sub-Coordinator')
        fireEvent.click(addButton)
      })

      expect(screen.getByText('Add New Sub-Coordinator')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter full name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument()
    })

    it('creates new sub-coordinator successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ coordinators: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'new-sub',
            name: 'New Sub Coordinator',
            email: 'newsub@test.com',
            status: 'ACTIVE'
          })
        })

      render(<SubCoordinatorManagement />)

      await waitFor(() => {
        const addButton = screen.getByText('Add Sub-Coordinator')
        fireEvent.click(addButton)
      })

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Enter full name'), {
        target: { value: 'New Sub Coordinator' }
      })
      fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
        target: { value: 'newsub@test.com' }
      })
      fireEvent.change(screen.getByPlaceholderText('Enter region'), {
        target: { value: 'Mumbai' }
      })
      fireEvent.change(screen.getByPlaceholderText('Enter password'), {
        target: { value: 'SecurePass123' }
      })

      // Submit form
      const createButton = screen.getByText('Create')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/coordinators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Sub Coordinator',
            email: 'newsub@test.com',
            phone: '',
            region: 'Mumbai',
            password: 'SecurePass123',
            role: 'SUB_COORDINATOR',
            parentCoordinatorId: 'coord123'
          })
        })
      })
    })

    it('handles status updates for sub-coordinators', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            coordinators: [
              {
                id: 'sub1',
                name: 'Sub Coordinator 1',
                email: 'sub1@test.com',
                status: 'PENDING'
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ACTIVE' })
        })

      render(<SubCoordinatorManagement />)

      await waitFor(() => {
        const approveButton = screen.getByText('Approve')
        fireEvent.click(approveButton)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/coordinators/sub1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      })
    })
  })

  describe('CoordinatorHierarchyTree', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockCoordinatorSession,
        status: 'authenticated'
      })
    })

    it('renders hierarchy tree with coordinator and sub-coordinators', async () => {
      const mockHierarchyData = {
        id: 'coord123',
        name: 'Test Coordinator',
        email: 'coordinator@test.com',
        role: 'COORDINATOR',
        status: 'ACTIVE',
        referralCodes: [{
          code: 'COORD-MUM-01',
          totalDonations: 10,
          totalAmount: 20000
        }],
        subCoordinators: [
          {
            id: 'sub1',
            name: 'Sub Coordinator 1',
            email: 'sub1@test.com',
            role: 'SUB_COORDINATOR',
            status: 'ACTIVE',
            referralCode: {
              code: 'SUB-MUM-01',
              totalDonations: 5,
              totalAmount: 8000
            }
          }
        ],
        performance: {
          totalAmount: 28000,
          totalDonations: 15,
          averageDonation: 1867
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHierarchyData
      })

      render(<CoordinatorHierarchyTree />)

      await waitFor(() => {
        expect(screen.getByText('Coordinator Hierarchy')).toBeInTheDocument()
        expect(screen.getByText('Test Coordinator')).toBeInTheDocument()
        expect(screen.getByText('Sub Coordinator 1')).toBeInTheDocument()
      })

      expect(screen.getByText('1 sub-coordinator')).toBeInTheDocument()
      expect(screen.getByText('₹28,000')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('shows empty state when no hierarchy data available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      render(<CoordinatorHierarchyTree />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Hierarchy')).toBeInTheDocument()
      })
    })

    it('allows expanding and collapsing tree nodes', async () => {
      const mockHierarchyData = {
        id: 'coord123',
        name: 'Test Coordinator',
        email: 'coordinator@test.com',
        role: 'COORDINATOR',
        status: 'ACTIVE',
        subCoordinators: [
          {
            id: 'sub1',
            name: 'Sub Coordinator 1',
            email: 'sub1@test.com',
            role: 'SUB_COORDINATOR',
            status: 'ACTIVE'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHierarchyData
      })

      render(<CoordinatorHierarchyTree />)

      await waitFor(() => {
        const expandButton = screen.getByText('▼')
        expect(expandButton).toBeInTheDocument()

        fireEvent.click(expandButton)
        expect(screen.getByText('▶')).toBeInTheDocument()
      })
    })
  })

  describe('ReferralAnalytics', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockCoordinatorSession,
        status: 'authenticated'
      })
    })

    it('renders analytics dashboard with overview metrics', async () => {
      const mockAnalyticsData = {
        overview: {
          totalAmount: 50000,
          totalDonations: 25,
          averageDonation: 2000,
          conversionRate: 12.5,
          activeSubCoordinators: 3
        },
        trends: [
          { date: '2024-01-01', amount: 5000, donations: 3 },
          { date: '2024-01-02', amount: 7000, donations: 4 }
        ],
        topPerformers: [
          {
            id: 'sub1',
            name: 'Top Performer',
            totalAmount: 15000,
            totalDonations: 8,
            conversionRate: 15.2
          }
        ],
        recentDonations: [
          {
            id: 'don1',
            donorName: 'John Doe',
            amount: 2000,
            createdAt: '2024-01-01T10:00:00Z',
            referralCode: 'COORD-MUM-01',
            attributedTo: 'Test Coordinator'
          }
        ],
        codeUsage: [
          {
            code: 'COORD-MUM-01',
            usageCount: 10,
            totalAmount: 20000,
            lastUsed: '2024-01-01T10:00:00Z'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData
      })

      render(<ReferralAnalytics />)

      await waitFor(() => {
        expect(screen.getByText('Referral Analytics')).toBeInTheDocument()
        expect(screen.getByText('₹50,000')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('₹2,000')).toBeInTheDocument()
        expect(screen.getByText('12.5%')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('allows switching between time ranges', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          overview: {
            totalAmount: 0,
            totalDonations: 0,
            averageDonation: 0,
            conversionRate: 0,
            activeSubCoordinators: 0
          },
          trends: [],
          topPerformers: [],
          recentDonations: [],
          codeUsage: []
        })
      })

      render(<ReferralAnalytics />)

      await waitFor(() => {
        const sevenDaysButton = screen.getByText('Last 7 Days')
        fireEvent.click(sevenDaysButton)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=7d')
      )
    })

    it('shows optimization suggestions based on performance', async () => {
      const mockAnalyticsData = {
        overview: {
          totalAmount: 1000,
          totalDonations: 5,
          averageDonation: 200, // Low average
          conversionRate: 2.5, // Low conversion rate
          activeSubCoordinators: 0 // No sub-coordinators
        },
        trends: [],
        topPerformers: [],
        recentDonations: [],
        codeUsage: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData
      })

      render(<ReferralAnalytics />)

      await waitFor(() => {
        expect(screen.getByText('💡 Optimization Suggestions')).toBeInTheDocument()
        expect(screen.getByText(/conversion rate is below 5%/)).toBeInTheDocument()
        expect(screen.getByText(/Average donation amount is low/)).toBeInTheDocument()
        expect(screen.getByText(/Consider recruiting sub-coordinators/)).toBeInTheDocument()
      })
    })

    it('handles analytics data fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Analytics fetch failed'))

      render(<ReferralAnalytics />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument()
        expect(screen.getByText(/Failed to load analytics data/)).toBeInTheDocument()
      })
    })
  })
})