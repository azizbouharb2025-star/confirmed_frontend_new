'use client'

import { ReactNode } from 'react'
import LanguageSelector from './LanguageSelector'
import ThemeToggle from './ThemeToggle'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold mb-1">{title}</h1>
            {subtitle && <p className="text-sm dark:text-slate-400 light:text-gray-600">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}