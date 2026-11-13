import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IconButton } from './IconButton'

// Zachowanie przycisków (click, disabled, pressed) jest testowane w Button.test.tsx.
// Tu weryfikujemy tylko to, co IconButton dokłada: label → aria-label (dymek testuje Tooltip.test.tsx).
describe('IconButton', () => {
  it('exposes label as aria-label', () => {
    render(<IconButton icon="Pencil" label="Edytuj" />)
    expect(screen.getByRole('button', { name: 'Edytuj' })).toHaveAttribute('aria-label', 'Edytuj')
  })
})
