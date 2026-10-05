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
      setLanguage: (lang: Language) =>
        set({ language: lang === 'ar' ? 'fr' : lang }),
      t: (key: TranslationKey) => {
        const { language } = get()
        return (translations[language] as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key
      }
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted =
          persistedState as Partial<LanguageStore> | undefined

        return {
          ...currentState,
          ...persisted,
          language:
            persisted?.language === 'ar'
              ? 'fr'
              : persisted?.language || 'fr',
        }
      },
    }
  )
)