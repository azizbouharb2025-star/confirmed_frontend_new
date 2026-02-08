'use client'

import { useEffect } from 'react'
import { useAuth } from './useAuth'

export function useSession() {
  const { user, isAuthenticated } = useAuth()

  const getDashboardPath = () => {
    if (!user) return '/panel/login'
    
    switch (user.role) {
      case 'admin':
        return '/panel/admin'
      case 'operator':
        return '/panel/op'
      case 'shop_owner':
        return '/panel/client'
      default:
        return '/panel/login'
    }
  }

  const redirectToDashboard = () => {
    if (isAuthenticated && user) {
      window.location.href = getDashboardPath()
    }
  }

  const redirectToLogin = () => {
    window.location.href = '/panel/login'
  }

  return {
    user,
    isAuthenticated,
    getDashboardPath,
    redirectToDashboard,
    redirectToLogin
  }
}