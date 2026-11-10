import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProviders } from './AppProviders'
import { routes } from './router'

// Pamięciowy router z tymi samymi trasami co aplikacja, ale startujący od podanego adresu.
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

describe('routes', () => {
  it('renders the home page at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'WorldSmith' })).toBeInTheDocument()
  })

  it('renders the map editor page at /map', () => {
    renderAt('/map')
    expect(screen.getByRole('heading', { name: 'Edytor map' })).toBeInTheDocument()
  })

  it('renders the 404 page for an unknown address, inside the layout', () => {
    renderAt('/nie-ma-takiej-strony')
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wróć na stronę główną' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the demo page at /dev/ui', () => {
    renderAt('/dev/ui')
    expect(screen.getByRole('heading', { name: /katalog komponentów/i })).toBeInTheDocument()
  })
})

describe('AppLayout', () => {
  it('marks the link of the current page as active', () => {
    renderAt('/map')
    const nav = screen.getByRole('navigation', { name: 'Główna nawigacja' })
    expect(within(nav).getByRole('link', { name: 'Edytor map' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(within(nav).getByRole('link', { name: 'Projekty' })).not.toHaveAttribute('aria-current')
  })

  it('shows visible Pxlkit attribution in the footer', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Joangel De La Rosa' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Licencja ikon' })).toHaveAttribute(
      'href',
      'https://github.com/Joangeldelarosa/pxlkit/blob/main/LICENSE-ASSETS'
    )
  })
})

describe('settings switchers in the header', () => {
  // Wybór trafia do localStorage — czyścimy, żeby kolejne testy startowały po polsku.
  afterEach(() => {
    localStorage.clear()
  })

  it('changes the theme and remembers it', () => {
    renderAt('/map')
    const group = screen.getByRole('group', { name: 'Motyw' })
    fireEvent.click(within(group).getByRole('button', { name: 'Kontrastowy' }))
    expect(document.documentElement.dataset.theme).toBe('contrast')
    expect(localStorage.getItem('worldsmith.theme')).toBe('contrast')
  })

  it('changes the language of the whole layout and remembers it', () => {
    renderAt('/map')
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Map Editor' })).toHaveAttribute('aria-current', 'page')
    expect(localStorage.getItem('worldsmith.lang')).toBe('en')
  })
})
