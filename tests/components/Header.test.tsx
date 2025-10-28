import { render, screen, fireEvent } from '@testing-library/react'
import { getFallbackContent } from '@/lib/content-types'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock next-auth completely
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock auth utils
jest.mock('@/lib/auth-utils', () => ({
  sessionUtils: {
    canAccessAdmin: () => false,
    canAccessCoordinator: () => false,
  }
}))

// Mock content provider
jest.mock('@/lib/content-provider', () => ({
  useContent: () => ({
    content: getFallbackContent(),
    loading: false,
    error: null,
    reloadContent: jest.fn(),
    isUsingFallback: false,
    lastUpdated: new Date(),
  }),
  ContentProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span>ChevronDown</span>,
  User: () => <span>User</span>,
  LogOut: () => <span>LogOut</span>,
  Settings: () => <span>Settings</span>,
  LayoutDashboard: () => <span>LayoutDashboard</span>,
}))

// Mock PWA Install Button
jest.mock('@/components/common/PWAInstallButton', () => {
  return function PWAInstallButton() {
    return <button>Install PWA</button>
  }
})

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>
    }
    return <button {...props}>{children}</button>
  }
}))

// Import Header after mocks
import Header from '@/components/common/Header'

describe('Header', () => {
  it('renders the organization name from dynamic content', () => {
    render(<Header />)

    expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument()
    expect(screen.getByText('Future Rise Life')).toBeInTheDocument()
  })

  it('renders navigation items from dynamic content', () => {
    render(<Header />)

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByText('ABOUT')).toBeInTheDocument()
    expect(screen.getByText('PROGRAMS')).toBeInTheDocument()
  })

  it('renders authentication buttons when not logged in', () => {
    render(<Header />)

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('renders donate button', () => {
    render(<Header />)

    const donateButton = screen.getByRole('link', { name: /donate now/i })
    expect(donateButton).toBeInTheDocument()
    expect(donateButton).toHaveAttribute('href', '/donate')
  })

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header />)

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    expect(mobileMenuButton).toBeInTheDocument()

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton)

    // Check if mobile navigation items are visible
    const mobileNavItems = screen.getAllByText('HOME')
    expect(mobileNavItems.length).toBeGreaterThan(1) // Desktop + Mobile
  })

  it('has proper navigation links from dynamic content', () => {
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'HOME' })
    const aboutLink = screen.getByRole('link', { name: 'ABOUT' })
    const programsLink = screen.getByRole('link', { name: 'PROGRAMS' })

    expect(homeLink).toHaveAttribute('href', '/')
    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(programsLink).toHaveAttribute('href', '/programs')
  })

  it('has sticky positioning', () => {
    const { container } = render(<Header />)
    const header = container.firstChild as HTMLElement

    expect(header).toHaveClass('sticky', 'top-0', 'z-50')
  })

  it('renders PWA install button', () => {
    render(<Header />)

    expect(screen.getByText('Install PWA')).toBeInTheDocument()
  })
})