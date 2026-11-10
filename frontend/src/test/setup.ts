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

// jsdom nie ma showModal() i close() na <dialog> (używa ich Modal).
// Zaślepka tylko przełącza atrybut open, bez blokowania reszty strony.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
}
