import { useState, type ReactNode } from 'react'
import { getInitialTheme, ThemeContext, STORAGE_KEY, type Theme } from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  function setTheme(next: Theme) {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage niedostępny (tryb prywatny, blokada przeglądarki) */
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
