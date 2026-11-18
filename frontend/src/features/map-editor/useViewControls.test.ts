import { act, fireEvent, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMapScene } from '@worldsmith/engine'
import { useEditorStore } from './store/editorStore'
import { useViewControls } from './useViewControls'

// Canvas 800×600 z mapą 640×480 przy zoomie 1.
function setup() {
  const element = document.createElement('div')
  const { result } = renderHook(() => useViewControls({ current: element }))
  return { element, result }
}

const zoom = () => useEditorStore.getState().zoom

describe('useViewControls', () => {
  beforeEach(() => {
    useEditorStore.getState().loadScene(createMapScene('Test', { width: 640, height: 480 }))
    useEditorStore.setState({ viewport: { width: 800, height: 600 }, zoom: 1 })
  })

  it('zooms with the wheel but not on a sideways scroll', () => {
    const { element } = setup()

    fireEvent.wheel(element, { deltaX: 40, deltaY: 0 })
    expect(zoom()).toBe(1)

    fireEvent.wheel(element, { deltaY: -100 })
    expect(zoom()).toBe(1.25)
  })

  it('leaves + and − with Ctrl or Cmd to the browser zoom', () => {
    setup()

    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    expect(zoom()).toBe(1)
    fireEvent.keyDown(window, { key: '+', metaKey: true })
    expect(zoom()).toBe(1)

    fireEvent.keyDown(window, { key: '+' })
    expect(zoom()).toBe(1.25)
  })

  it('releases the space when the window loses focus', () => {
    const { result } = setup()

    fireEvent.keyDown(window, { code: 'Space' })
    expect(result.current.cursor).toBe('grab')

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(result.current.cursor).toBeUndefined()
  })
})
