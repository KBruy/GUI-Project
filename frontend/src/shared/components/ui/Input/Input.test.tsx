import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  // Etykieta powiązana przez htmlFor = kliknięcie w nią ustawia fokus w przeglądarce.
  it('links the label with the input', () => {
    render(<Input label="Nazwa" />)
    expect(screen.getByLabelText('Nazwa')).toBeInstanceOf(HTMLInputElement)
  })

  it('shows the error under the field and links it with aria-describedby', () => {
    render(<Input label="Nazwa" error="Pole jest wymagane" />)
    const input = screen.getByLabelText('Nazwa')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Pole jest wymagane')
  })

  it('has no aria-invalid without an error', () => {
    render(<Input label="Nazwa" />)
    expect(screen.getByLabelText('Nazwa')).not.toHaveAttribute('aria-invalid')
  })
})
