import { describe, expect, it } from 'vitest'
import { canPlace, createMapScene, EngineError, ENGINE_VERSION, MAP_SIZES } from './index'

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
})
