import { describe, expect, it } from 'vitest'
import { createMapScene, EngineError, ENGINE_VERSION, MAP_SIZES } from './index'

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
})
