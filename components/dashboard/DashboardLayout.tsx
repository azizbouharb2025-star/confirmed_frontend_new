'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bars3Icon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import LanguageSelector from '@/components/ui/LanguageSelector'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import RealTimeNotifications from '@/components/ui/RealTimeNotifications'
import NotificationBell from '@/components/dashboard/NotificationBell'
import ShopWalletButton from '@/components/dashboard/ShopWalletButton'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import api from '@/lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'admin' | 'operator' | 'shop_owner'
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { logout } = useAuth()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'

  const handleLogout = async () => {
    /*
     * Seul l'opérateur possède actuellement
     * une session de présence métier.
     */
    if (userRole === 'operator') {
      try {
        await api.post(
          '/api/auth/logout',
          {}
        )
      } catch {
        /*
         * Une panne réseau ne doit jamais empêcher
         * l'utilisateur de se déconnecter localement.
         */
      }
    }

    logout()
  }

  /*
   * Présence opérateur.
   *
   * Ce heartbeat indique uniquement que la session
   * est encore connectée.
   *
   * Il NE compte PAS comme activité opérationnelle.
   */
  useEffect(() => {
    if (userRole !== 'operator') {
      return
    }

    let stopped = false

    const sendPresence = async () => {
      if (stopped) {
        return
      }

      try {
        await api.post(
          '/api/operators/presence',
          {}
        )
      } catch {
        /*
         * Une erreur temporaire de présence ne doit
         * pas bloquer l'interface opérateur.
         */
      }
    }

    /*
     * Heartbeat immédiat à l'ouverture
     * d'une page opérateur.
     */
    void sendPresence()

    const interval =
      window.setInterval(
        () => {
          void sendPresence()
        },
        30000
      )

    /*
     * Si le navigateur a fortement ralenti les timers
     * pendant que l'onglet était masqué, on renvoie
     * immédiatement une présence au retour.
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        void sendPresence()
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      stopped = true

      window.clearInterval(
        interval
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [userRole])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  // Close sidebar on route change / escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        setProfileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />

      <div className="lg:pl-64">
        <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${
          isDark
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
              }`}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            
            <div className="flex-1" />

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <ConnectionStatus />
              </div>
              <LanguageSelector />
              <ThemeToggle />

              {userRole === 'shop_owner' && (
                <ShopWalletButton />
              )}
              
              <NotificationBell />

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                  }`}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border p-1 shadow-xl z-50 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    <button onClick={() => { setProfileOpen(false); router.push('/panel/profile') }} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('common.profile')}</button>
                    <button onClick={() => { setProfileOpen(false); router.push(userRole === 'admin' ? '/panel/admin/settings' : '/panel/settings') }} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      isDark
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>{t('nav.settings')}</button>
                    <div className={`my-1 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />
                    <button onClick={() => { void handleLogout() }} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors text-red-500 ${
                      isDark ? 'hover:bg-slate-700' : 'hover:bg-red-50'
                    }`}>{t('common.signOut')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
      
      <RealTimeNotifications />
    </div>
  )
}