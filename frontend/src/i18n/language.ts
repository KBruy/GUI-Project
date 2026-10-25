import { createContext, useContext } from 'react'
import type { Language, TranslationKey } from './dictionary'

export const STORAGE_KEY = 'worldsmith.lang'

// Czyta zapisany język z localStorage. Brak wpisu → 'pl' (domyślny).
export function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'pl' || stored === 'en') return stored
  } catch {
    /* localStorage niedostępny (tryb prywatny, blokada przeglądarki) */
  }
  return 'pl'
}

export interface LanguageContextValue {
  t: (key: TranslationKey) => string
  language: Language
  setLanguage: (lang: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

// Rzuca błąd zamiast zwracać null — wymusza użycie hooka wewnątrz LanguageProvider.
export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useT must be used inside LanguageProvider')
  return ctx
}
