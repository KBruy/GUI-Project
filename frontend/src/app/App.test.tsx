import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from './AppProviders'
import App from './App.tsx'

describe('App', () => {
  it('renders WorldSmith heading', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )
    expect(screen.getByRole('heading', { name: 'WorldSmith' })).toBeInTheDocument()
  })
})
