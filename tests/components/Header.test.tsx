import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/common/Header'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('Header', () => {
  it('renders the logo and organization name', () => {
    render(<Header />)

    const logo = screen.getByText('A')
    expect(logo).toBeInTheDocument()

    expect(screen.getByText('ARPU Foundation')).toBeInTheDocument()
    expect(screen.getByText('Future Rise Life')).toBeInTheDocument()
  })

  it('renders navigation items on desktop', () => {
    render(<Header />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Programs')).toBeInTheDocument()
    expect(screen.getByText('Stories')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders donate button', () => {
    render(<Header />)

    const donateButton = screen.getByRole('link', { name: /donate now/i })
    expect(donateButton).toBeInTheDocument()
    expect(donateButton).toHaveAttribute('href', '/donate')
  })

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header />)

    const mobileMenuButton = screen.getByRole('button')
    expect(mobileMenuButton).toBeInTheDocument()

    // Mobile menu should not be visible initially
    expect(screen.queryByText('Mobile Navigation')).not.toBeInTheDocument()

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton)

    // Check if mobile navigation items are visible
    const mobileNavItems = screen.getAllByText('Home')
    expect(mobileNavItems.length).toBeGreaterThan(1) // Desktop + Mobile
  })

  it('has proper navigation links', () => {
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'Home' })
    const aboutLink = screen.getByRole('link', { name: 'About' })
    const programsLink = screen.getByRole('link', { name: 'Programs' })

    expect(homeLink).toHaveAttribute('href', '/')
    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(programsLink).toHaveAttribute('href', '/programs')
  })

  it('has sticky positioning', () => {
    const { container } = render(<Header />)
    const header = container.firstChild as HTMLElement

    expect(header).toHaveClass('sticky', 'top-0', 'z-50')
  })
})