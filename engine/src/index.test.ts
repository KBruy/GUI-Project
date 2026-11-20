import { describe, expect, it } from 'vitest'
import {
  canPlace,
  createMapScene,
  EngineError,
  ENGINE_VERSION,
  MAP_SIZES,
  addObjects,
  canUndo,
  emptyHistory,
  execute,
  undo,
} from './index'

describe('engine', () => {
  it('eksportuje wersję', () => {
    expect(ENGINE_VERSION).toBe('0.0.0')
  })
})

describe('publiczne API', () => {
  it('eksportuje tworzenie scen i błędy', () => {
    const scene = createMapScene('Test', MAP_SIZES[0])
    expect(scene.type).toBe('map')
    expect(new EngineError('LAYER_LIMIT').code).toBe('LAYER_LIMIT')
  })
  it('eksportuje sprawdzanie kolizji', () => {
    const empty = createMapScene('Test', MAP_SIZES[0])
    const object = {
      id: 'obj_1',
      assetId: 'test',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }
    const scene = { ...empty, layers: [{ ...empty.layers[0], objects: [object] }] }
    expect(canPlace(scene, 'obj_1', { x: 200 })).toEqual({ ok: true })
  })

  it('eksportuje polecenia i historię (cofnięcie pędzla)', () => {
    const scene = createMapScene('Test', MAP_SIZES[0])
    const tile = { id: 'map_terrain_grass_01', width: 32, height: 32 }
    const centers = [
      { x: 16, y: 16 },
      { x: 48, y: 16 },
    ]
    const command = addObjects(scene.layers[0].id, tile, centers)
    const { history, result } = execute(emptyHistory, scene, command)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].objects).toHaveLength(2)
    expect(canUndo(history)).toBe(true)
    expect(undo(history, result.scene).scene).toEqual(scene)
  })
})
