import '@testing-library/jest-dom/vitest'

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
