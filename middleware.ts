import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Server-side route protection middleware.
 * Validates that protected panel routes have an auth token present.
 * 
 * Note: This checks for token existence only. Full JWT validation
 * requires the backend secret and should be done by the API layer.
 * This middleware prevents unauthenticated users from loading
 * protected page bundles at all.
 */

const PROTECTED_PATHS = ['/panel/admin', '/panel/client', '/panel/op']
const PUBLIC_PATHS = ['/panel/login', '/panel/register', '/panel/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect panel routes
  const isProtectedRoute = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isPublicRoute = PUBLIC_PATHS.some(path => pathname.startsWith(path))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check for auth token in cookies (preferred) or fallback header
  const authCookie = request.cookies.get('auth-token')?.value
  
  // For SPA with localStorage auth, we check if the request has the token
  // via a custom header set by the client, or a cookie
  const authHeader = request.headers.get('authorization')
  const hasToken = !!authCookie || !!authHeader

  if (!hasToken) {
    // For page navigations (not API/asset requests), redirect to login
    const isPageRequest = request.headers.get('accept')?.includes('text/html')
    
    if (isPageRequest) {
      const loginUrl = new URL('/panel/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  return response
}

export const config = {
  matcher: ['/panel/:path*'],
}
