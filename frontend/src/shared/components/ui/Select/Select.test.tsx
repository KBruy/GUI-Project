import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

const OPTIONS = [
  { value: 'small' as const, label: 'Mała' },
  { value: 'large' as const, label: 'Duża' },
]

describe('Select', () => {
  it('calls onChange with the chosen option value', () => {
    const onChange = vi.fn()
    render(<Select label="Rozmiar" options={OPTIONS} value="small" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Rozmiar'), { target: { value: 'large' } })
    expect(onChange).toHaveBeenCalledWith('large')
  })

  it('links the error with aria-describedby', () => {
    render(
      <Select
        label="Rozmiar"
        options={OPTIONS}
        value="small"
        onChange={vi.fn()}
        error="Zły wybór"
      />
    )
    expect(screen.getByLabelText('Rozmiar')).toHaveAccessibleDescription('Zły wybór')
  })
})
