'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const { t } = useLanguage()
  const { theme } = useTheme()

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected')
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className={`max-w-6xl mx-auto backdrop-blur-xl rounded-3xl shadow-2xl border ${
            theme === 'dark' 
              ? 'bg-[#1a1a1a]/95 border-white/10' 
              : 'bg-white/95 border-gray-200'
          }`}>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {t('cookies.title')}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {t('cookies.description')}{' '}
                    <Link href="/privacy" className="text-[#32CD32] hover:text-[#ADFF2F] underline">
                      {t('cookies.learnMore')}
                    </Link>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={acceptCookies}
                      className="px-6 py-3 bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black font-semibold rounded-full hover:shadow-lg hover:shadow-[#ADFF2F]/25 transition-all duration-300"
                    >
                      {t('cookies.accept')}
                    </button>
                    <button
                      onClick={rejectCookies}
                      className={`px-6 py-3 rounded-full font-semibold border-2 transition-all duration-300 ${
                        theme === 'dark'
                          ? 'border-white/20 text-white hover:bg-white/10'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t('cookies.reject')}
                    </button>
                  </div>
                </div>
                <button
                  onClick={rejectCookies}
                  className={`p-2 rounded-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <XMarkIcon className={`w-6 h-6 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
