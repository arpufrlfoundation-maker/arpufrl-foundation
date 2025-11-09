'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import PWAInstallButton from './PWAInstallButton'
import { useContent } from '@/lib/content-provider'
import { NavigationItem } from '@/lib/content-types'
import { sessionUtils } from '@/lib/auth-utils'
import { ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const { content, loading } = useContent()

  // Convert navigation items to proper format with links
  const getNavigationItems = (navItems: NavigationItem[]) => {
    return navItems.map(item => ({
      ...item,
      href: item.link || getDefaultLink(item.label)
    }))
  }

  // Get default link based on label
  const getDefaultLink = (label: string): string => {
    const labelLower = label.toLowerCase()
    switch (labelLower) {
      case 'home':
        return '/'
      case 'about':
        return '/about'
      case 'programs':
      case 'our plan':
        return '/programs'
      case 'stories':
        return '/stories'
      case 'contact':
        return '/contact'
      case 'donate':
      case 'charity':
        return '/donate'
      case 'registration':
      case 'join us':
        return '/register'
      case 'team':
        return '/about#team'
      case 'legals':
        return '/legal'
      case 'contest':
        return '/contest'
      case 'award':
        return '/awards'
      default:
        return '#'
    }
  }

  const navigationItems = loading ? [] : getNavigationItems(content.navigation)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    setIsUserMenuOpen(false)
  }

  const getUserDashboardLink = () => {
    if (!session?.user?.role) return '/dashboard'

    if (sessionUtils.canAccessAdmin(session)) {
      return '/dashboard/admin'
    } else if (sessionUtils.canAccessCoordinator(session)) {
      return '/dashboard/coordinator'
    }
    return '/dashboard'
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="hidden sm:block">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              ))}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Organization Name */}
          <Link href="/" className="flex items-center space-x-3">
            {content.organization.logo_image ? (
              <Image
                src={content.organization.logo_image}
                alt={content.organization.name}
                width={120}
                height={100}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {content.organization.name.charAt(0)}
                </span>
              </div>
            )}
            {/* <div className="hidden sm:block">
              <div className="font-bold text-gray-900 text-lg">
                {content.organization.name}
              </div>
              <div className="text-xs text-gray-600">
                Future Rise Life
              </div>
            </div> */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <NavigationItemComponent key={item.id || item.label} item={item} />
            ))}
          </nav>

          {/* Desktop Auth & CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <PWAInstallButton />

            {/* Authentication UI */}
            {status === 'loading' ? (
              <div className="flex items-center space-x-3">
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ) : session ? (
              <UserMenu
                session={session}
                isOpen={isUserMenuOpen}
                onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onSignOut={handleSignOut}
                dashboardLink={getUserDashboardLink()}
              />
            ) : (
              <AuthButtons />
            )}

            <Button asChild>
              <Link href="/donate">Donate Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <MobileMenu
            navigationItems={navigationItems}
            session={session}
            status={status}
            onClose={() => setIsMobileMenuOpen(false)}
            onSignOut={handleSignOut}
            dashboardLink={getUserDashboardLink()}
          />
        )}
      </div>
    </header>
  )
}

// Navigation Item Component with support for nested items
interface NavigationItemComponentProps {
  item: NavigationItem & { href: string }
}

function NavigationItemComponent({ item }: NavigationItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (item.children && item.children.length > 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors"
        >
          {item.label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {item.children.map((child, index) => (
              <Link
                key={child.id || index}
                href={child.link || getDefaultLink(child.label)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
    >
      {item.label}
    </Link>
  )
}

// Authentication Buttons Component
function AuthButtons() {
  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/login"
        className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
      >
        Login
      </Link>
      <Button asChild variant="outline" size="sm">
        <Link href="/register">Sign Up</Link>
      </Button>
    </div>
  )
}

// User Menu Component
interface UserMenuProps {
  session: any
  isOpen: boolean
  onToggle: () => void
  onSignOut: () => void
  dashboardLink: string
}

function UserMenu({ session, isOpen, onToggle, onSignOut, dashboardLink }: UserMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
      >
        <User className="h-5 w-5" />
        <span className="hidden lg:block">{session.user.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
            {session.user.role && (
              <p className="text-xs text-blue-600 font-medium capitalize">
                {session.user.role.toLowerCase()}
              </p>
            )}
          </div>

          <Link
            href={dashboardLink}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            onClick={onToggle}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/account/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            onClick={onToggle}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>

          <button
            onClick={onSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// Mobile Menu Component
interface MobileMenuProps {
  navigationItems: (NavigationItem & { href: string })[]
  session: any
  status: string
  onClose: () => void
  onSignOut: () => void
  dashboardLink: string
}

function MobileMenu({ navigationItems, session, status, onClose, onSignOut, dashboardLink }: MobileMenuProps) {
  return (
    <div className="md:hidden border-t border-gray-200 py-4">
      <nav className="flex flex-col space-y-4">
        {navigationItems.map((item) => (
          <Link
            key={item.id || item.label}
            href={item.href}
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-2 py-1"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}

        <div className="pt-4 border-t border-gray-200">
          {status === 'loading' ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : session ? (
            <div className="space-y-3">
              <div className="px-2 py-1">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
                {session.user.role && (
                  <p className="text-xs text-blue-600 font-medium capitalize">
                    {session.user.role.toLowerCase()}
                  </p>
                )}
              </div>

              <Link
                href={dashboardLink}
                className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors px-2 py-1"
                onClick={onClose}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>

              <button
                onClick={() => {
                  onSignOut()
                  onClose()
                }}
                className="flex items-center text-gray-700 hover:text-red-600 font-medium transition-colors px-2 py-1 w-full text-left"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                className="block text-gray-700 hover:text-blue-600 font-medium transition-colors px-2 py-1"
                onClick={onClose}
              >
                Login
              </Link>
              <Button asChild className="w-full">
                <Link href="/register" onClick={onClose}>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-gray-200">
            <Button asChild className="w-full">
              <Link href="/donate" onClick={onClose}>
                Donate Now
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )
}

// Helper function for default links (moved outside component to avoid recreation)
function getDefaultLink(label: string): string {
  const labelLower = label.toLowerCase()
  switch (labelLower) {
    case 'home':
      return '/'
    case 'about':
      return '/about'
    case 'programs':
    case 'our plan':
      return '/programs'
    case 'stories':
      return '/stories'
    case 'contact':
      return '/contact'
    case 'donate':
    case 'charity':
      return '/donate'
    case 'registration':
    case 'join us':
      return '/register'
    case 'team':
      return '/about#team'
    case 'legals':
      return '/legal'
    case 'contest':
      return '/contest'
    case 'award':
      return '/awards'
    default:
      return '#'
  }
}