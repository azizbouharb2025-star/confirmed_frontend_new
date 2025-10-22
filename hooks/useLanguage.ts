'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { translations, Language, TranslationKey } from '@/lib/i18n'

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'fr',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: TranslationKey) => {
        const { language } = get()
        return translations[language][key] || translations.en[key] || key
      }
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)