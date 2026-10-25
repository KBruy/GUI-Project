import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Kliknij</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Kliknij</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('sets aria-pressed="true" when pressed is true', () => {
    render(<Button pressed={true}>Toggle</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets aria-pressed="false" when pressed is false', () => {
    render(<Button pressed={false}>Toggle</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  // Przycisk bez pressed nie może mieć aria-pressed w DOM — czytniki ekranu
  // inaczej interpretują brak atrybutu niż aria-pressed="false".
  it('does not set aria-pressed when pressed prop is absent', () => {
    render(<Button>Normalny</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('defaults to type="button" to avoid accidental form submission', () => {
    render(<Button>Submit?</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
