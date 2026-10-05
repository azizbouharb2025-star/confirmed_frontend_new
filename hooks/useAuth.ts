'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SubscriptionPlan } from '@/types/subscription'
import logger from '@/lib/logger'

interface User {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role: 'admin' | 'operator' | 'shop_owner'
  subscriptionPlan?: SubscriptionPlan
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user: User, token: string) => {
        const fallbackParts = (user.name || '').trim().split(/\s+/).filter(Boolean)

        const firstName =
          user.firstName ??
          fallbackParts[0] ??
          ''

        const lastName =
          user.lastName ??
          fallbackParts.slice(1).join(' ')

        const normalizedUser: User = {
          ...user,
          firstName,
          lastName,
          name:
            user.name ||
            `${firstName} ${lastName}`.trim()
        }

        logger.debug('Login called with user:', normalizedUser, 'Auth')

        set({
          user: normalizedUser,
          token,
          isAuthenticated: true
        })
      },
      logout: () => {
        logger.debug('Logout called', undefined, 'Auth')
        set({ user: null, token: null, isAuthenticated: false })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
          window.location.href = '/panel/login'
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        logger.debug('Auth rehydrated:', state, 'Auth')
      }
    }
  )
)