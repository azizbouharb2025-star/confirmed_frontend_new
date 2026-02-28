'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { language } = useLanguage()

  useEffect(() => {
    // Update HTML lang and dir attributes
    const html = document.documentElement
    html.lang = language
    html.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  return <>{children}</>
}
