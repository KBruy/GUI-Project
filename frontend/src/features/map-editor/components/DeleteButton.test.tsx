import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { addObject, createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 64 }
const objects = () => useEditorStore.getState().scene!.layers.flatMap((layer) => layer.objects)

it('deletes the selected objects with Delete in one undo step', () => {
  const store = useEditorStore.getState()
  store.loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  const layerId = useEditorStore.getState().activeLayerId!
  store.execute(addObject(layerId, TREE, { x: 100, y: 100 }))
  store.execute(addObject(layerId, TREE, { x: 300, y: 100 }))
  store.select(objects().map((object) => object.id))
  renderHook(() => useEditorShortcuts())

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
  })
  expect(objects()).toHaveLength(0)

  act(() => useEditorStore.getState().undo())
  expect(objects()).toHaveLength(2)
})
