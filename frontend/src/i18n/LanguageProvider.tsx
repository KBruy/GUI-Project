import { useState, type ReactNode } from 'react'
import { dictionary, type Language, type TranslationKey } from './dictionary'
import { LanguageContext, STORAGE_KEY, getInitialLanguage } from './language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  function t(key: TranslationKey): string {
    return dictionary[key][language]
  }

  // Zapisuje wybór użytkownika i aktualizuje atrybut lang na <html> dla czytników ekranu.
  function setLanguage(lang: Language) {
    setLanguageState(lang)
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* localStorage niedostępny (tryb prywatny, blokada przeglądarki) */
    }
  }

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
