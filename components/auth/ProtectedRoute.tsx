'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: ('admin' | 'operator' | 'shop_owner')[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/panel/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated) {
      window.location.href = redirectTo
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      switch (user.role) {
        case 'admin':
          window.location.href = '/panel/admin'
          break
        case 'operator':
          window.location.href = '/panel/op'
          break
        case 'shop_owner':
          window.location.href = '/panel/client'
          break
        default:
          window.location.href = '/panel/login'
      }
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, redirectTo])

  // Show loading state while hydrating or auth is being checked
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}