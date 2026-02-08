'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { Language } from '@/lib/i18n'

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇹🇳' }
]

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { theme } = useTheme()
  
  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute right-0 mt-2 w-48 glass-card p-2 z-50 shadow-xl border ${
              theme === 'dark' 
                ? 'bg-slate-800/95 border-slate-700' 
                : 'bg-white/95 border-gray-200'
            }`}
          >
            <div className="space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                    language === lang.code 
                      ? 'bg-[#ADFF2F]/20 text-[#ADFF2F]' 
                      : theme === 'dark'
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}