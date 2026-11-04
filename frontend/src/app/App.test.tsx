import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from './AppProviders'
import App from './App.tsx'

// vi.stubGlobal nie resetuje się automatycznie — czyścimy po każdym teście, żeby pathname
// nie wyciekało między przypadkami testowymi.
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders WorldSmith heading', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    )
    expect(screen.getByRole('heading', { name: 'WorldSmith' })).toBeInTheDocument()
  })

  it('renders demo page at /dev/ui', () => {
    vi.stubGlobal('location', { pathname: '/dev/ui' })
    render(
      <AppProviders>
        <App />
      </AppProviders>
    )
    expect(screen.getByRole('heading', { name: /katalog komponentów/i })).toBeInTheDocument()
  })

  it('shows visible Pxlkit attribution in the footer', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    )
    expect(screen.getByRole('link', { name: 'Joangel De La Rosa' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Licencja ikon' })).toHaveAttribute(
      'href',
      'https://github.com/Joangeldelarosa/pxlkit/blob/main/LICENSE-ASSETS'
    )
  })
})
