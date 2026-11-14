import { describe, expect, it } from 'vitest'
import { EngineError } from '../errors'
import type { Layer, Scene, SceneObject } from '../types'
import { canPlace } from './can-place'

// Kwadrat 20 × 20 o podanym id i środku.
const square = (id: string, x: number, y: number): SceneObject => ({
  id,
  assetId: 'test_square',
  x,
  y,
  width: 20,
  height: 20,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
})

const layer = (id: string, objects: SceneObject[]): Layer => ({
  id,
  name: id,
  visible: true,
  locked: false,
  objects,
})

// Warstwa „trawa” z dwoma kwadratami obok siebie i warstwa „drzewa” z jednym kwadratem.
const scene: Scene = {
  schemaVersion: 1,
  id: 'scene_test',
  type: 'map',
  name: 'Test',
  width: 640,
  height: 480,
  gridSize: 32,
  background: { color: '#7ec850' },
  layers: [
    layer('grass', [square('a', 100, 100), square('b', 200, 100)]),
    layer('trees', [square('tree', 300, 100)]),
  ],
  createdAt: '2026-11-14T12:00:00Z',
  updatedAt: '2026-11-14T12:00:00Z',
}

describe('canPlace', () => {
  it('wolne miejsce: ok', () => {
    expect(canPlace(scene, 'a', { x: 100, y: 300 })).toEqual({ ok: true })
  })

  it('obiekt nie koliduje sam ze sobą (mały ruch w miejscu)', () => {
    expect(canPlace(scene, 'a', { x: 105 })).toEqual({ ok: true })
  })

  it('najechanie na obiekt z tej samej warstwy zwraca jego id', () => {
    expect(canPlace(scene, 'a', { x: 195 })).toEqual({ ok: false, collidesWith: ['b'] })
  })

  it('obiekty z innej warstwy nie przeszkadzają', () => {
    expect(canPlace(scene, 'a', { x: 300 })).toEqual({ ok: true })
  })

  it('uwzględnia obrót i skalę, nie tylko pozycję', () => {
    // a ma środek 30 px od b; skala 3 robi z niego kwadrat 60 × 60, który sięga b.
    expect(canPlace(scene, 'a', { x: 170, scaleX: 3, scaleY: 3 })).toEqual({
      ok: false,
      collidesWith: ['b'],
    })
    expect(canPlace(scene, 'a', { x: 170, rotation: 45 })).toEqual({ ok: true })
  })

  it('nie zmienia sceny', () => {
    canPlace(scene, 'a', { x: 195 })
    expect(scene.layers[0].objects[0].x).toBe(100)
  })

  it('nieznany obiekt: EngineError z kodem OBJECT_NOT_FOUND', () => {
    let caught: unknown
    try {
      canPlace(scene, 'missing', { x: 0 })
    } catch (error) {
      caught = error
    }
    expect(caught instanceof EngineError).toBe(true)
    expect((caught as EngineError).code).toBe('OBJECT_NOT_FOUND')
  })
})
