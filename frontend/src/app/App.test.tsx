import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders } from './AppProviders'
import { AppFooter } from './AppFooter'
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

  it('renders the demo page at /dev/ui', () => {
    renderAt('/dev/ui')
    expect(screen.getByRole('heading', { name: /katalog komponentów/i })).toBeInTheDocument()
  })
})

describe('AppFooter', () => {
  it('shows visible Pxlkit attribution', () => {
    render(
      <AppProviders>
        <AppFooter />
      </AppProviders>
    )
    expect(screen.getByRole('link', { name: 'Joangel De La Rosa' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Licencja ikon' })).toHaveAttribute(
      'href',
      'https://github.com/Joangeldelarosa/pxlkit/blob/main/LICENSE-ASSETS'
    )
  })
})
