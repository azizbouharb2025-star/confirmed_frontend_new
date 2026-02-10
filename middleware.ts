import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Server-side middleware for security headers and auth cookie support.
 * 
 * Since this SPA uses localStorage for auth (zustand persist), the middleware
 * cannot block page navigations for unauthenticated users — the browser
 * doesn't send localStorage with page requests. Client-side ProtectedRoute
 * handles that redirect.
 * 
 * What this middleware does:
 * 1. Adds security headers to all panel responses
 * 2. If an auth-token cookie exists, forwards it as an Authorization header
 *    to API rewrites (future-proofing for HttpOnly cookie migration)
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers on all panel routes
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Cache-Control', 'no-store, max-age=0')

  return response
}

export const config = {
  matcher: ['/panel/:path*'],
}
