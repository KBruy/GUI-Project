import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function renderTooltip() {
    render(
      <Tooltip text="Usuń obiekt">
        <button>X</button>
      </Tooltip>
    )
    return screen.getByRole('button')
  }

  it('shows after the delay on keyboard focus, not immediately', () => {
    const button = renderTooltip()
    fireEvent.focus(button)
    expect(screen.queryByText('Usuń obiekt')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByText('Usuń obiekt')).toBeInTheDocument()
  })

  it('hides on blur and on Escape', () => {
    const button = renderTooltip()
    fireEvent.mouseEnter(button)
    act(() => vi.advanceTimersByTime(300))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Usuń obiekt')).not.toBeInTheDocument()

    fireEvent.focus(button)
    act(() => vi.advanceTimersByTime(300))
    fireEvent.blur(button)
    expect(screen.queryByText('Usuń obiekt')).not.toBeInTheDocument()
  })
  it('hides when the page scrolls', () => {
    const button = renderTooltip()
    fireEvent.mouseEnter(button)
    act(() => vi.advanceTimersByTime(300))
    fireEvent.scroll(window)
    expect(screen.queryByText('Usuń obiekt')).not.toBeInTheDocument()
  })
})
