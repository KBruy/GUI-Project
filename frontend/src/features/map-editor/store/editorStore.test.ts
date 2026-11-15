import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Scene } from '@worldsmith/engine'
import type { Asset } from '@/shared/lib/assets'
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
  })

  describe('assets', () => {
    const ROCK: Asset = {
      id: 'map_rock_01',
      module: 'map',
      category: 'rocks',
      nameKey: 'assets.map.rock',
      file: 'map/rocks/map_rock_01.png',
      width: 32,
      height: 32,
    }

    beforeEach(() => {
      // Widok 1:1 bez przesunięcia: punkt ekranu = punkt sceny. Środek canvasu to (100, 90).
      useEditorStore.setState({
        viewport: { width: 200, height: 180 },
        zoom: 1,
        offset: { x: 0, y: 0 },
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('loads the map assets from the backend', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(JSON.stringify([ROCK]), { status: 200 })))
      )
      await store().loadAssets()
      expect(store().assets).toEqual([ROCK])
      expect(store().assetsError).toBeNull()
    })

    it('keeps the error key when the backend is down', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
      )
      await store().loadAssets()
      expect(store().assetsError).toBe('errors.network')
    })

    it('adds the asset in the middle of the view, snapped to the grid', () => {
      expect(store().addAsset(ROCK)).toEqual({ ok: true })
      // Środek (100, 90) → lewy górny róg (84, 74) → siatka (96, 64) → środek obiektu (112, 80).
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 112, y: 80 })
    })

    it('does not snap when snapping is off', () => {
      store().setGridSnap(false)
      store().addAsset(ROCK)
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 100, y: 90 })
      store().setGridSnap(true)
    })

    it('keeps the whole object inside the map', () => {
      store().addAsset(ROCK, { x: 630, y: -50 })
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 624, y: 16 })
    })

    it('refuses to add on top of another object on the same layer', () => {
      store().addAsset(ROCK)
      expect(store().addAsset(ROCK)).toMatchObject({ ok: false })
      expect(store().scene!.layers[1].objects).toHaveLength(1)
    })
  })
})
