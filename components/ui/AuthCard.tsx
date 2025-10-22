'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useTheme } from '@/hooks/useTheme'
import LanguageSelector from './LanguageSelector'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'
import Image from 'next/image'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      theme === 'dark' ? 'bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a]' : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'
    }`}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-20 left-20 w-32 h-32 rounded-full blur-xl opacity-30 ${
            theme === 'dark' ? 'bg-[#ADFF2F]' : 'bg-blue-400'
          }`}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute top-40 right-32 w-24 h-24 rounded-full blur-xl opacity-20 ${
            theme === 'dark' ? 'bg-purple-500' : 'bg-pink-400'
          }`}
        />
      </div>

      {/* Logo */}
      <Link href="/" className="fixed top-6 left-6 z-50">
        <Image 
          src={theme === 'dark' ? '/assets/logo2.png' : '/assets/logo1.png'}
          alt="Confirmed"
          width={120}
          height={80}
          className="object-contain"
        />
      </Link>
      
      {/* Language and Theme Controls */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${
          theme === 'dark' 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF] bg-clip-text text-transparent`}>
              {title}
            </h1>
            {subtitle && (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{subtitle}</p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}