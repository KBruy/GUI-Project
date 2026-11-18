import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useElementSize } from './useElementSize'

// jsdom nie liczy układu strony, więc ResizeObserver podmieniamy na taki, którym sterujemy z testu.
let notify: (width: number, height: number) => void = () => {}
let disconnected = false
const OriginalResizeObserver = globalThis.ResizeObserver

beforeEach(() => {
  disconnected = false
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      notify = (width, height) =>
        callback([{ contentRect: { width, height } } as ResizeObserverEntry], this)
    }
    observe() {}
    unobserve() {}
    disconnect() {
      disconnected = true
    }
  }
})

afterEach(() => {
  globalThis.ResizeObserver = OriginalResizeObserver
})

function Measured() {
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  return <div ref={ref}>{`${width}x${height}`}</div>
}

describe('useElementSize', () => {
  it('starts at zero and follows size changes (rounded down)', () => {
    render(<Measured />)
    expect(screen.getByText('0x0')).toBeInTheDocument()

    act(() => notify(800.6, 600.2))

    expect(screen.getByText('800x600')).toBeInTheDocument()
  })

  it('stops observing after unmount', () => {
    const { unmount } = render(<Measured />)

    unmount()

    expect(disconnected).toBe(true)
  })
})
