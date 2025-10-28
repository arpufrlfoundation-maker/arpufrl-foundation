import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { UserRole } from './models/User'

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard/admin': [UserRole.ADMIN],
  '/dashboard/coordinator': [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR],
  '/api/admin': [UserRole.ADMIN],
  '/api/coordinator': [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUB_COORDINATOR],
} as const

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/programs',
  '/contact',
  '/donate',
  '/stories',
  '/login',
  '/register',
  '/api/auth',
  '/api/donations',
  '/api/programs',
  '/api/webhooks',
]

// Auth routes that should redirect if already authenticated
const authRoutes = ['/login', '/register']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session
  const session = await auth()

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (session && isAuthRoute) {
    const redirectUrl = getRedirectUrl(session.user.role)
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // If route is public, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access for protected routes
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(session.user.role as any)) {
        // User doesn't have required role, redirect to appropriate dashboard
        const redirectUrl = getRedirectUrl(session.user.role)
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
      break
    }
  }

  // Check if user account is active
  if (session.user.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/account-inactive', request.url))
  }

  return NextResponse.next()
}

// Helper function to get redirect URL based on user role
function getRedirectUrl(userRole: string): string {
  switch (userRole) {
    case UserRole.ADMIN:
      return '/dashboard/admin'
    case UserRole.COORDINATOR:
    case UserRole.SUB_COORDINATOR:
      return '/dashboard/coordinator'
    default:
      return '/'
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}