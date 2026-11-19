import { describe, expect, it } from 'vitest'
import { checkCollisions } from './collisions'
import { layer, sceneWith, square, validScene } from './test-scene'

describe('checkCollisions', () => {
  it('obiekty daleko od siebie: brak problemów', () => {
    expect(checkCollisions(validScene)).toEqual([])
  })

  it('para nachodzących obiektów: jeden problem przy drugim z nich', () => {
    const scene = sceneWith([layer('grass', [square('a', 100, 100), square('b', 110, 100)])])
    expect(checkCollisions(scene)).toEqual([
      { code: 'COLLISION', messageKey: 'errors.collision', layerId: 'grass', objectId: 'b' },
    ])
  })

  it('stykanie się krawędziami nie jest kolizją', () => {
    const scene = sceneWith([layer('grass', [square('a', 100, 100), square('b', 120, 100)])])
    expect(checkCollisions(scene)).toEqual([])
  })

  it('obiekty na różnych warstwach mogą się nakładać', () => {
    const scene = sceneWith([
      layer('grass', [square('a', 100, 100)]),
      layer('trees', [square('b', 100, 100)]),
    ])
    expect(checkCollisions(scene)).toEqual([])
  })
})
