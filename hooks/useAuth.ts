'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SubscriptionPlan } from '@/types/subscription'
import logger from '@/lib/logger'

interface User {
  id: string
  name: string
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
        logger.debug('Login called with user:', user, 'Auth')
        set({ user, token, isAuthenticated: true })
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