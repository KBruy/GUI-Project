import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IconButton } from './IconButton'

// Zachowanie przycisków (click, disabled, pressed) jest testowane w Button.test.tsx.
// Tu weryfikujemy tylko to, co IconButton dokłada: mapowanie label → aria-label i title.
describe('IconButton', () => {
  it('exposes label as aria-label and title', () => {
    render(<IconButton icon="Pencil" label="Edytuj" />)
    const btn = screen.getByRole('button', { name: 'Edytuj' })
    expect(btn).toHaveAttribute('aria-label', 'Edytuj')
    expect(btn).toHaveAttribute('title', 'Edytuj')
  })
})
