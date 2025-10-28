import { render, screen, waitFor } from '@testing-library/react'
import ProgramGrid from '@/components/public/ProgramGrid'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('ProgramGrid', () => {
  it('renders loading state initially', () => {
    render(<ProgramGrid />)

    // Check for loading skeletons
    const loadingElements = screen.getAllByRole('generic')
    expect(loadingElements.some(el => el.classList.contains('animate-pulse'))).toBe(true)
  })

  it('renders programs after loading', async () => {
    render(<ProgramGrid />)

    // Wait for programs to load
    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText('Healthcare Access')).toBeInTheDocument()
    expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument()
    expect(screen.getByText('Women Empowerment')).toBeInTheDocument()
  })

  it('displays program status badges', async () => {
    render(<ProgramGrid />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    // Check for status badges
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows funding progress for programs with targets', async () => {
    render(<ProgramGrid />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    // Check for funding information
    expect(screen.getByText(/Raised:/)).toBeInTheDocument()
    expect(screen.getByText(/Goal:/)).toBeInTheDocument()
    expect(screen.getByText(/funded/)).toBeInTheDocument()
  })

  it('renders action buttons for each program', async () => {
    render(<ProgramGrid />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    const donateButtons = screen.getAllByText('Donate Now')
    const learnMoreButtons = screen.getAllByText('Learn More')

    expect(donateButtons.length).toBeGreaterThan(0)
    expect(learnMoreButtons.length).toBeGreaterThan(0)

    // Check that buttons have correct href attributes
    expect(donateButtons[0].closest('a')).toHaveAttribute('href', '/donate?program=education-for-all')
    expect(learnMoreButtons[0].closest('a')).toHaveAttribute('href', '/programs/education-for-all')
  })

  it('displays category icons', async () => {
    render(<ProgramGrid />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    // Check for category icons (emojis)
    const container = screen.getByText('Education for All').closest('.bg-white')
    expect(container).toBeInTheDocument()
  })

  it('shows pagination when there are multiple pages', async () => {
    render(<ProgramGrid />)

    await waitFor(() => {
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    // Since we have 6 programs and 9 per page, there should be no pagination
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })
})