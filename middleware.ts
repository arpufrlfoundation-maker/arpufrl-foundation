import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { UserRole } from './models/User'

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard/admin': [UserRole.ADMIN],
  '/dashboard/coordinator': [
    UserRole.ADMIN,
    UserRole.CENTRAL_PRESIDENT,
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI
  ],
  '/api/admin': [UserRole.ADMIN],
  '/api/coordinator': [
    UserRole.ADMIN,
    UserRole.CENTRAL_PRESIDENT,
    UserRole.STATE_PRESIDENT,
    UserRole.STATE_COORDINATOR,
    UserRole.ZONE_COORDINATOR,
    UserRole.DISTRICT_PRESIDENT,
    UserRole.DISTRICT_COORDINATOR,
    UserRole.BLOCK_COORDINATOR,
    UserRole.NODAL_OFFICER,
    UserRole.PRERAK,
    UserRole.PRERNA_SAKHI
  ],
} as const

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/programs',
  '/documents',
  '/contact',
  '/donate',
  '/stories',
  '/login',
  '/volunteer', // Public volunteer application page
  '/api/auth',
  '/api/contact', // Public contact form submission
  '/api/content',
  '/api/donations',
  '/api/donors', // Public donor highlights
  '/api/programs',
  '/api/webhooks',
  '/api/volunteer/requests', // Public volunteer submission (POST only, GET is protected)
  '/api/referrals/validate', // Public referral code validation
  '/survey',
  '/api/surveys', // Allow public survey submissions
  '/api/team', // Public team information
  '/api/test-email', // Public test email endpoint
  '/forgot-password',
]

// Auth routes that should redirect if already authenticated
// Note: These are also included in publicRoutes for unauthenticated access
const authRoutes = ['/login']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session
  const session = await auth()

  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (session && isAuthRoute) {
    const redirectUrl = getRedirectUrl(session.user.role)
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Check if route is public (includes auth routes for unauthenticated users)
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  ) || isAuthRoute

  // If route is public, allow access
  if (isPublicRoute) {
    const response = NextResponse.next()
    // Add no-cache headers for public routes to ensure fresh content
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if user account is active (before role checks)
  if (session.user.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/account-inactive', request.url))
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

  // Add no-cache headers for protected routes
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

// Helper function to get redirect URL based on user role
function getRedirectUrl(userRole: string): string {
  switch (userRole) {
    case UserRole.ADMIN:
      return '/dashboard/admin'
    case UserRole.CENTRAL_PRESIDENT:
    case UserRole.STATE_PRESIDENT:
    case UserRole.STATE_COORDINATOR:
    case UserRole.ZONE_COORDINATOR:
    case UserRole.DISTRICT_PRESIDENT:
    case UserRole.DISTRICT_COORDINATOR:
    case UserRole.BLOCK_COORDINATOR:
    case UserRole.NODAL_OFFICER:
    case UserRole.PRERAK:
    case UserRole.PRERNA_SAKHI:
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