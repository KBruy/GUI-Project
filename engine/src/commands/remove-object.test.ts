import { describe, expect, it } from 'vitest'
import { removeObjects } from './remove-object'
import { layer, sceneWith, square } from './test-scene'
import { EngineError } from '../errors'

const scene = sceneWith([
  layer('grass', [square('a', 100, 100), square('b', 200, 100), square('c', 300, 100)]),
  layer('trees', [square('tree', 100, 300)]),
])

describe('removeObjects', () => {
  it('usuwa obiekty z różnych warstw', () => {
    const result = removeObjects(['b', 'tree']).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].objects.map((o) => o.id)).toEqual(['a', 'c'])
    expect(result.scene.layers[1].objects).toHaveLength(0)
  })

  it('pomija nieznane id', () => {
    const result = removeObjects(['missing']).apply(scene)
    expect(result).toEqual({ ok: true, scene })
  })

  it('undo przywraca obiekty na te same miejsca (ta sama kolejność rysowania)', () => {
    const command = removeObjects(['a', 'c', 'tree'])
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('nie zmienia sceny, którą dostał', () => {
    removeObjects(['a']).apply(scene)
    expect(scene.layers[0].objects).toHaveLength(3)
  })

  it('obiekt na zablokowanej warstwie: LAYER_LOCKED i nic nie znika', () => {
    const locked = sceneWith([
      layer('grass', [square('a', 100, 100)]),
      layer('body', [square('b', 300, 300)], true),
    ])
    let caught: unknown
    try {
      removeObjects(['a', 'b']).apply(locked)
    } catch (error) {
      caught = error
    }
    expect(caught instanceof EngineError).toBe(true)
    expect((caught as EngineError).code).toBe('LAYER_LOCKED')
    expect(locked.layers[0].objects).toHaveLength(1)
  })
})
