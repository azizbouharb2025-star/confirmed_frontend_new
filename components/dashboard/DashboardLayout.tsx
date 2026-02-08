'use client'

import { useState } from 'react'
import { Bars3Icon, BellIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import LanguageSelector from '@/components/ui/LanguageSelector'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import RealTimeNotifications from '@/components/ui/RealTimeNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'admin' | 'operator' | 'shop_owner'
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { logout, user } = useAuth()
  const { t } = useLanguage()
  


  return (
    <div className="min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b dark:bg-slate-900/95 dark:border-slate-800 light:bg-white/95 light:border-gray-200 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 rounded-lg transition-colors">
              <Bars3Icon className="w-5 h-5" />
            </button>
            
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <ConnectionStatus />
              <LanguageSelector />
              <ThemeToggle />
              
              <button className="relative p-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>

              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 rounded-lg transition-colors">
                  <UserCircleIcon className="w-6 h-6" />
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 card p-1 shadow-lg">
                    <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors">{t('common.profile')}</button>
                    <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors">{t('nav.settings')}</button>
                    <div className="my-1 border-t dark:border-slate-800 light:border-gray-200" />
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors text-red-500">{t('common.signOut')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
      
      {/* Real-time notifications */}
      <RealTimeNotifications />
    </div>
  )
}