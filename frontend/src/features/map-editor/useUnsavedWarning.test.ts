import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { addObject, createMapScene, MAP_SIZES } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { useUnsavedWarning } from './useUnsavedWarning'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 96 }

// Zwraca true, gdy przeglądarka zapytałaby o zamknięcie karty.
function closeTab() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

beforeEach(() => {
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
})

describe('useUnsavedWarning', () => {
  it('asks before closing the tab only when there are unsaved changes', () => {
    renderHook(() => useUnsavedWarning())
    expect(closeTab()).toBe(false)

    const layerId = useEditorStore.getState().activeLayerId!
    act(() => {
      useEditorStore.getState().execute(addObject(layerId, TREE, { x: 100, y: 100 }))
    })
    expect(closeTab()).toBe(true)

    // Np. po zapisie albo wczytaniu innej mapy.
    act(() => useEditorStore.getState().loadScene(createMapScene('Inna', MAP_SIZES[0], 'W')))
    expect(closeTab()).toBe(false)
  })
})
