'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  if (!mounted) {
    return <div className="dark">{children}</div>
  }

  return <div className={theme}>{children}</div>
}