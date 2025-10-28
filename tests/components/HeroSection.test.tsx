import { render, screen } from '@testing-library/react'
import HeroSection from '@/components/public/HeroSection'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('HeroSection', () => {
  it('renders the main heading', () => {
    render(<HeroSection />)

    expect(screen.getByText('Empowering Communities,')).toBeInTheDocument()
    expect(screen.getByText('Transforming Lives')).toBeInTheDocument()
  })

  it('renders the mission statement', () => {
    render(<HeroSection />)

    expect(screen.getByText(/ARPU Future Rise Life Foundation is dedicated/)).toBeInTheDocument()
  })

  it('renders call-to-action buttons', () => {
    render(<HeroSection />)

    const donateButton = screen.getByRole('link', { name: /donate now/i })
    const programsButton = screen.getByRole('link', { name: /view programs/i })

    expect(donateButton).toBeInTheDocument()
    expect(donateButton).toHaveAttribute('href', '/donate')

    expect(programsButton).toBeInTheDocument()
    expect(programsButton).toHaveAttribute('href', '/programs')
  })

  it('renders impact statistics', () => {
    render(<HeroSection />)

    expect(screen.getByText('10,000+')).toBeInTheDocument()
    expect(screen.getByText('Lives Impacted')).toBeInTheDocument()

    expect(screen.getByText('50+')).toBeInTheDocument()
    expect(screen.getByText('Active Programs')).toBeInTheDocument()

    expect(screen.getByText('₹2.5Cr+')).toBeInTheDocument()
    expect(screen.getByText('Funds Raised')).toBeInTheDocument()
  })

  it('has proper responsive classes', () => {
    const { container } = render(<HeroSection />)
    const section = container.firstChild as HTMLElement

    expect(section).toHaveClass('relative', 'bg-gradient-to-br', 'text-white')
  })
})