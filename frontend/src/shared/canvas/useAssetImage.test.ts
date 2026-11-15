import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAssetImage } from './useAssetImage'

// Zapisujemy każdy utworzony <img>, żeby w teście móc go „załadować”.
const OriginalImage = window.Image
let created: HTMLImageElement[] = []

beforeEach(() => {
  created = []
  window.Image = class extends OriginalImage {
    constructor() {
      super()
      created.push(this)
    }
  } as typeof Image
})

afterEach(() => {
  window.Image = OriginalImage
})

// jsdom nie pobiera obrazów, więc koniec ładowania udajemy ręcznie.
function finishLoading(image: HTMLImageElement) {
  Object.defineProperty(image, 'complete', { value: true })
  Object.defineProperty(image, 'naturalWidth', { value: 32 })
  act(() => {
    image.dispatchEvent(new Event('load'))
  })
}

// Cache jest wspólny dla modułu, więc każdy test używa innego adresu.
describe('useAssetImage', () => {
  it('returns null without url', () => {
    const { result } = renderHook(() => useAssetImage(undefined))

    expect(result.current).toBeNull()
    expect(created).toHaveLength(0)
  })

  it('returns null until the image loads, then the image', () => {
    const { result } = renderHook(() => useAssetImage('/assets/tree.png'))
    expect(result.current).toBeNull()

    finishLoading(created[0])

    expect(result.current).toBe(created[0])
    expect(created[0].crossOrigin).toBe('anonymous')
  })

  it('loads the same url only once', () => {
    const first = renderHook(() => useAssetImage('/assets/log.png'))
    const second = renderHook(() => useAssetImage('/assets/log.png'))

    finishLoading(created[0])

    expect(created).toHaveLength(1)
    expect(first.result.current).toBe(created[0])
    expect(second.result.current).toBe(created[0])
  })

  it('keeps returning null when the image fails to load', () => {
    const { result } = renderHook(() => useAssetImage('/assets/missing.png'))

    act(() => {
      created[0].dispatchEvent(new Event('error'))
    })

    expect(result.current).toBeNull()
  })
})
