import { describe, expect, it } from 'vitest'
import { layer, sceneWith, square } from './test-scene'
import { transformObjects } from './transform-object'

const scene = sceneWith([
  layer('grass', [square('a', 100, 100), square('b', 200, 100), square('c', 100, 200)]),
])

describe('transformObjects', () => {
  it('przesuwa obiekt', () => {
    const result = transformObjects(['a'], { x: 320, y: 128 }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const [a] = result.scene.layers[0].objects
    expect(a.x).toBe(320)
    expect(a.y).toBe(128)
  })

  it('obraca kilka obiektów naraz i zostawia pozostałe pola', () => {
    const result = transformObjects(['a', 'b'], { rotation: 90 }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const [a, b, c] = result.scene.layers[0].objects
    expect(a.rotation).toBe(90)
    expect(b.rotation).toBe(90)
    expect(c.rotation).toBe(0)
    expect(a.x).toBe(100)
  })

  it('przy kolizji z nieruszanym obiektem zwraca jego id', () => {
    const result = transformObjects(['a'], { x: 195 }).apply(scene)
    expect(result).toEqual({ ok: false, collidesWith: ['b'] })
  })

  it('przesuwane obiekty nie kolidują między sobą', () => {
    // Skala 6 robi z a i c kwadraty 120 × 120, które na siebie nachodzą, ale nie sięgają b.
    const result = transformObjects(['a', 'c'], { scaleX: 6, scaleY: 6 }).apply(scene)
    expect(result.ok).toBe(true)
  })

  it('cofnij po przesunięciu przywraca pozycję', () => {
    const command = transformObjects(['a'], { x: 320, y: 128 })
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('cofnij przywraca każdemu obiektowi jego własne wartości', () => {
    const command = transformObjects(['a', 'b'], { y: 400 })
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const [a, b] = command.undo(result.scene).layers[0].objects
    expect(a.x).toBe(100)
    expect(b.x).toBe(200)
    expect(a.y).toBe(100)
  })
})
