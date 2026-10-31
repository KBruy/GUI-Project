import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'a' as const, label: 'Alfa' },
  { value: 'b' as const, label: 'Beta' },
  { value: 'c' as const, label: 'Gamma' },
]

describe('SegmentedControl', () => {
  it('calls onChange with the clicked option value', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl options={OPTIONS} value="a" onChange={onChange} label="Wybór" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('marks the active option with aria-pressed="true"', () => {
    render(
      <SegmentedControl options={OPTIONS} value="b" onChange={vi.fn()} label="Wybór" />,
    )
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alfa' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders group with aria-label', () => {
    render(
      <SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} label="Moja grupa" />,
    )
    expect(screen.getByRole('group', { name: 'Moja grupa' })).toBeInTheDocument()
  })
})
