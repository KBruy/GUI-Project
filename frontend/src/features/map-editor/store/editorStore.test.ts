import { beforeEach, describe, expect, it } from 'vitest'
import type { Scene } from '@worldsmith/engine'
import { addObject } from '../engine/engine'
import { useEditorStore } from './editorStore'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 64 }

function makeScene(): Scene {
  return {
    schemaVersion: 1,
    id: 'scene-1',
    type: 'map',
    name: 'Test',
    width: 640,
    height: 480,
    gridSize: 32,
    background: { color: '#7ec850' },
    layers: [
      { id: 'ground', name: 'Ziemia', visible: true, locked: false, objects: [] },
      { id: 'top', name: 'Góra', visible: true, locked: false, objects: [] },
    ],
    createdAt: '2026-11-10T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  }
}

const store = useEditorStore.getState

describe('editor store', () => {
  beforeEach(() => {
    store().loadScene(makeScene())
  })

  it('picks the top layer as active after loading a scene', () => {
    expect(store().activeLayerId).toBe('top')
  })

  it('updates the scene in the store after executing a command', () => {
    const result = store().execute(addObject('top', TREE, { x: 100, y: 100 }))

    expect(result).toEqual({ ok: true })
    expect(store().scene?.layers[1].objects).toHaveLength(1)
  })

  it('drops removed objects from the selection on undo', () => {
    store().execute(addObject('top', TREE, { x: 100, y: 100 }))
    const id = store().scene!.layers[1].objects[0].id
    store().select([id])

    store().undo()

    expect(store().scene?.layers[1].objects).toHaveLength(0)
    expect(store().selectedIds).toEqual([])
  })
})
