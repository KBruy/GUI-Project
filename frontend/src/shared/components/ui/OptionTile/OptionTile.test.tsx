import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OptionTile } from './OptionTile'

describe('OptionTile', () => {
  it('is a button named by its label and marks selection with aria-pressed', () => {
    render(<OptionTile label="Trawa" imageUrl="/grass.png" selected />)
    expect(screen.getByRole('button', { name: 'Trawa' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('has aria-pressed="false" when not selected and calls onClick', () => {
    const onClick = vi.fn()
    render(<OptionTile label="Kłoda" imageUrl="/log.png" onClick={onClick} />)
    const tile = screen.getByRole('button', { name: 'Kłoda' })
    expect(tile).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(tile)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows the image when imageUrl is given, and no image in the "none" variant', () => {
    const { container, rerender } = render(<OptionTile label="Trawa" imageUrl="/grass.png" />)
    expect(container.querySelector('img[src="/grass.png"]')).toBeInTheDocument()
    rerender(<OptionTile label="Brak" />)
    expect(container.querySelector('img[src="/grass.png"]')).not.toBeInTheDocument()
  })
})
