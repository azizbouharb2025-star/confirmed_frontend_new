'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className
}: ButtonProps) {
  const baseClasses = 'relative overflow-hidden rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50'
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] hover:from-[#32CD32] hover:to-[#ADFF2F] text-black font-bold shadow-lg hover:shadow-2xl hover:shadow-[#ADFF2F]/25',
    secondary: 'bg-white/10 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 hover:bg-white/20 dark:hover:bg-slate-700/50',
    ghost: 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </motion.button>
  )
}