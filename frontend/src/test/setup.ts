import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// @testing-library/react nie rejestruje cleanup automatycznie bez globals:true w Vitest.
afterEach(() => {
  cleanup()
})

// jsdom nie implementuje window.matchMedia — potrzebne przez getInitialTheme()
// (prefers-color-scheme, prefers-contrast). Stub zawsze zwraca false (brak dopasowania).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
