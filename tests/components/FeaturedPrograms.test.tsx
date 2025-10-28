import { render, screen, waitFor } from '@testing-library/react'
import FeaturedPrograms from '@/components/public/FeaturedPrograms'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('FeaturedPrograms', () => {
  it('renders loading state initially', () => {
    render(<FeaturedPrograms />)

    expect(screen.getByText('Featured Programs')).toBeInTheDocument()
    expect(screen.getByText(/Support our ongoing initiatives/)).toBeInTheDocument()

    // Check for loading skeletons
    const loadingElements = screen.getAllByRole('generic')
    expect(loadingElements.some(el => el.classList.contains('animate-pulse'))).toBe(true)
  })

  it('renders programs after loading', async () => {
    render(<FeaturedPrograms />)

    // Wait for programs to load
    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText('Healthcare Access')).toBeInTheDocument()
    expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument()
  })

  it('displays program funding information', async () => {
    render(<FeaturedPrograms />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    // Check for funding progress elements
    expect(screen.getByText(/₹3.3L/)).toBeInTheDocument() // Raised amount
    expect(screen.getByText(/₹5.0L/)).toBeInTheDocument() // Target amount
    expect(screen.getByText(/156 donors/)).toBeInTheDocument()
  })

  it('renders donation and learn more buttons', async () => {
    render(<FeaturedPrograms />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    const donateButtons = screen.getAllByText('Donate Now')
    const learnMoreButtons = screen.getAllByText('Learn More')

    expect(donateButtons.length).toBeGreaterThan(0)
    expect(learnMoreButtons.length).toBeGreaterThan(0)
  })

  it('renders view all programs button', async () => {
    render(<FeaturedPrograms />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    const viewAllButton = screen.getByRole('link', { name: /view all programs/i })
    expect(viewAllButton).toBeInTheDocument()
    expect(viewAllButton).toHaveAttribute('href', '/programs')
  })
})