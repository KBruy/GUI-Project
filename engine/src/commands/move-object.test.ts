import { describe, expect, it } from 'vitest'
import { EngineError } from '../errors'
import { moveObjects } from './move-object'
import { layer, sceneWith, square } from './test-scene'

const scene = sceneWith([
  layer('grass', [square('a', 100, 100), square('b', 140, 100), square('c', 300, 100)]),
])

describe('moveObjects', () => {
  it('przesuwa każdy obiekt o ten sam wektor, zachowując odstępy', () => {
    const result = moveObjects(['a', 'b'], { x: 10, y: 50 }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const [a, b, c] = result.scene.layers[0].objects
    expect(a.x).toBe(110)
    expect(a.y).toBe(150)
    expect(b.x).toBe(150)
    expect(b.y).toBe(150)
    expect(c.x).toBe(300)
    expect(c.y).toBe(100)
  })

  it('przy kolizji z nieruszanym obiektem zwraca jego id', () => {
    const result = moveObjects(['a', 'b'], { x: 150, y: 0 }).apply(scene)
    expect(result).toEqual({ ok: false, collidesWith: ['c'] })
  })

  it('przesuwane obiekty nie kolidują między sobą', () => {
    // a dojeżdża na miejsce b, ale b też się przesuwa.
    const result = moveObjects(['a', 'b'], { x: 40, y: 0 }).apply(scene)
    expect(result.ok).toBe(true)
  })

  it('cofnij przywraca pozycje całej grupy', () => {
    const command = moveObjects(['a', 'b'], { x: 10, y: 50 })
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('cofnij przy ułamkach wraca dokładnie do starej pozycji', () => {
    // 0.1 + 0.2 - 0.2 to w JavaScripcie 0.10000000000000003,
    // więc samo odjęcie wektora przy cofaniu nie wystarczy.
    const small = sceneWith([layer('grass', [square('d', 0.1, 0.1)])])
    const command = moveObjects(['d'], { x: 0.2, y: 0.2 })
    const result = command.apply(small)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(small)
  })

  it('obiekt na zablokowanej warstwie: EngineError z kodem LAYER_LOCKED', () => {
    const locked = sceneWith([layer('body', [square('a', 100, 100)], true)])
    let caught: unknown
    try {
      moveObjects(['a'], { x: 10, y: 0 }).apply(locked)
    } catch (error) {
      caught = error
    }
    expect(caught instanceof EngineError).toBe(true)
    expect((caught as EngineError).code).toBe('LAYER_LOCKED')
  })
})
