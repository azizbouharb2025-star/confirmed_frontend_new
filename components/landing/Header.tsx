'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { useSession } from '@/hooks/useSession'
import LanguageSelector from '@/components/ui/LanguageSelector'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

export default function Header() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { isAuthenticated, getDashboardPath } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95])
  const headerBlur = useTransform(scrollY, [0, 100], [20, 40])

  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      setIsScrolled(latest > 50)
    })
    return () => unsubscribe()
  }, [scrollY])

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      style={{ 
        backdropFilter: `blur(${headerBlur}px)`,
        background: theme === 'dark' 
          ? `rgba(18, 18, 18, ${headerOpacity})` 
          : `rgba(255, 255, 255, ${headerOpacity})`
      }}
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        theme === 'dark' 
          ? 'border-white/10 shadow-2xl shadow-purple-500/10' 
          : 'border-black/10 shadow-2xl shadow-blue-500/10'
      } ${isScrolled ? 'py-2' : 'py-4'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/">
            <Image 
              src={theme === 'dark' ? '/assets/logo2.png' : '/assets/logo1.png'}
              alt="Confirmed"
              width={300}
              height={300}
              className={`object-contain transition-all duration-300 ${
                isScrolled ? 'w-28 h-16' : 'w-32 h-20'
              }`}
            />
          </Link>
        </motion.div>

        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          {[
            { key: 'features', label: 'Features' },
            { key: 'pricing', label: 'Pricing' },
            { key: 'product', label: 'Product' },
            { key: 'testimonials', label: 'Testimonials' },
            { key: 'about', label: 'About' }
          ].map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
            >
              <button 
                onClick={() => scrollToSection(item.key)}
                className={`relative font-medium transition-all duration-300 group ${
                  theme === 'dark' ? 'text-white hover:text-[#ADFF2F]' : 'text-gray-800 hover:text-[#ADFF2F]'
                }`}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] transition-all duration-300 group-hover:w-full" />
              </button>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden sm:block"
          >
            <LanguageSelector />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <ThemeToggle />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href={isAuthenticated ? getDashboardPath() : "/panel/register"}
              className="relative px-3 sm:px-6 py-2 rounded-full text-xs sm:text-base font-semibold transition-all duration-300 overflow-hidden group bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black shadow-md hover:shadow-lg hover:shadow-[#ADFF2F]/25 whitespace-nowrap"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#32CD32] to-[#ADFF2F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              <span className="relative z-10">
                {isAuthenticated ? t('nav.myDashboard') : t('nav.getStarted')}
              </span>
            </Link>
          </motion.div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />
            ) : (
              <Bars3Icon className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`lg:hidden absolute top-full left-0 right-0 border-b ${
            theme === 'dark'
              ? 'bg-[#121212]/95 border-white/10'
              : 'bg-white/95 border-black/10'
          } backdrop-blur-xl`}
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {[
              { key: 'features', label: 'Features' },
              { key: 'pricing', label: 'Pricing' },
              { key: 'product', label: 'Product' },
              { key: 'testimonials', label: 'Testimonials' },
              { key: 'about', label: 'About' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  scrollToSection(item.key)
                  setIsMobileMenuOpen(false)
                }}
                className={`block w-full text-left py-2 font-medium transition-colors ${
                  theme === 'dark' ? 'text-white hover:text-[#ADFF2F]' : 'text-gray-800 hover:text-[#ADFF2F]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </motion.div>
      )}
    </motion.header>
  )
}