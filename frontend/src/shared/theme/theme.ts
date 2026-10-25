import { createContext, useContext } from 'react'

// Nowy motyw: dopisanie wartości tutaj i dodanie bloku [data-theme='...'] w theme.css.
export const THEMES = ['dark', 'light', 'contrast'] as const
export type Theme = (typeof THEMES)[number]

// Klucz przechowywany w localStorage — nie musi wychodzić poza ten folder,
// bo zewnętrzny kod korzysta z getInitialTheme() i setTheme(), nie z klucza wprost.
export const STORAGE_KEY = 'worldsmith.theme'

// Priorytety: zapisany wybór > prefers-contrast: more > prefers-color-scheme > light.
// Używana zarówno przy starcie (main.tsx) jak i w ThemeProvider — jedno źródło prawdy.
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (THEMES as readonly string[]).includes(stored)) return stored as Theme
  } catch {
    /* localStorage niedostępny (tryb prywatny, blokada przeglądarki) */
  }
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'contrast'
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

// Rzuca błąd zamiast zwracać null — wymusza użycie hooka wewnątrz ThemeProvider.
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
