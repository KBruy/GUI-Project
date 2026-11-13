import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Slider } from './Slider'

describe('Slider', () => {
  it('calls onChange with a number, not a string', () => {
    const onChange = vi.fn()
    render(<Slider label="Skala" min={1} max={4} value={1} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Skala'), { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('shows the current value next to the slider', () => {
    render(<Slider label="Skala" min={1} max={4} value={2} onChange={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('2')
  })
})
