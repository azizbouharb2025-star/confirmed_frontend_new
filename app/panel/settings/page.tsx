'use client'

import { useState } from 'react'
import { BellIcon, SunIcon, MoonIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const userRole = user?.role || 'shop_owner'

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const handleLanguageChange = (lang: 'en' | 'fr' | 'ar') => {
    setLanguage(lang)
    toast.success(t('common.saved'))
  }

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    toast.success(t('common.saved'))
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'operator', 'shop_owner']}>
      <DashboardLayout userRole={userRole}>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {t('settings.subtitle')}
            </p>
          </div>

          {/* Notifications */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              {t('settings.notifications')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t('settings.emailNotifications')}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('settings.emailNotificationsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    emailNotifications ? 'bg-[#32CD32]' : isDark ? 'bg-slate-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={emailNotifications}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${
                    emailNotifications ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t('settings.pushNotifications')}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('settings.pushNotificationsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pushNotifications ? 'bg-[#32CD32]' : isDark ? 'bg-slate-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={pushNotifications}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${
                    pushNotifications ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GlobeAltIcon className="h-5 w-5" />
              {t('settings.language')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {([
                { code: 'en' as const, label: 'English', flag: '🇬🇧' },
                { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
                { code: 'ar' as const, label: 'العربية', flag: '🇹🇳' },
              ]).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    language === lang.code
                      ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#32CD32]'
                      : isDark
                        ? 'border-slate-700 hover:border-slate-600 text-slate-300'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <p className="mt-1">{lang.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {isDark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              {t('settings.theme')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                  theme === 'light'
                    ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#32CD32]'
                    : isDark
                      ? 'border-slate-700 hover:border-slate-600 text-slate-300'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <SunIcon className="h-5 w-5" />
                {t('settings.light')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                  theme === 'dark'
                    ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#32CD32]'
                    : isDark
                      ? 'border-slate-700 hover:border-slate-600 text-slate-300'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <MoonIcon className="h-5 w-5" />
                {t('settings.dark')}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
