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

  it('keeps grid toggles when another scene is loaded', () => {
    store().setGridVisible(false)
    store().setGridSnap(false)

    store().loadScene(makeScene())

    expect(store().gridVisible).toBe(false)
    expect(store().gridSnap).toBe(false)
    // Przywracamy domyślne, bo store jest wspólny dla wszystkich testów.
    store().setGridVisible(true)
    store().setGridSnap(true)
  })

  describe('view', () => {
    beforeEach(() => {
      // Pierwszy pomiar canvasu dopasowuje scenę 640×480 do ekranu.
      useEditorStore.setState({ viewport: { width: 0, height: 0 } })
      store().setViewport({ width: 800, height: 600 })
    })

    it('fits the scene to the screen after the first measurement', () => {
      expect(store().zoom).toBeCloseTo(536 / 480)
    })

    it('zooms at the center of the canvas by default', () => {
      store().zoomTo(2)

      const { zoom, offset } = store()
      expect(zoom).toBe(2)
      // Środek canvasu (400, 300) pokazuje środek sceny (320, 240), tak jak przed zoomem.
      expect(offset.x + 320 * zoom).toBeCloseTo(400)
      expect(offset.y + 240 * zoom).toBeCloseTo(300)
    })

    it('does not pan the scene off the screen', () => {
      store().panBy(10_000, 0)

      expect(store().offset.x).toBe(800 - 64)
    })

    it('keeps the middle of the view in the middle after a resize', () => {
      const { zoom, offset } = store()
      store().setViewport({ width: 1000, height: 500 })

      // Zoom się nie zmienia, a widok przesuwa się o połowę różnicy rozmiarów.
      expect(store().zoom).toBe(zoom)
      expect(store().offset).toEqual({ x: offset.x + 100, y: offset.y - 50 })
    })

    it('keeps the scene on the screen after the canvas shrinks', () => {
      // Mapa przesunięta do prawej krawędzi, a potem canvas zwęża się do 300 px.
      store().panBy(10_000, 0)
      store().setViewport({ width: 300, height: 600 })

      expect(store().offset.x).toBe(300 - 64)
    })
  })
})
