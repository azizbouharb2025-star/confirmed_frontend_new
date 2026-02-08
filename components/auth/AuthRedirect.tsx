'use client'

import { useEffect } from 'react'
import { useSession } from '@/hooks/useSession'

interface AuthRedirectProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectIfAuth?: boolean
}

export default function AuthRedirect({ 
  children, 
  requireAuth = false, 
  redirectIfAuth = false 
}: AuthRedirectProps) {
  const { isAuthenticated, redirectToDashboard, redirectToLogin } = useSession()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      redirectToLogin()
    } else if (redirectIfAuth && isAuthenticated) {
      redirectToDashboard()
    }
  }, [isAuthenticated, requireAuth, redirectIfAuth, redirectToDashboard, redirectToLogin])

  // Show loading while checking auth state
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Don't render if redirecting authenticated user
  if (redirectIfAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <>{children}</>
}