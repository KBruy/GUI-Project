import { describe, expect, it } from 'vitest'
import { moveLayer } from './move-layer'
import { errorCode, layer, sceneWith } from './test-scene'

const scene = sceneWith([layer('grass', []), layer('trees', []), layer('rocks', [])])
const order = (s: typeof scene) => s.layers.map((l) => l.id)

describe('moveLayer', () => {
  it('przenosi warstwę wyżej', () => {
    const result = moveLayer('grass', 2).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['trees', 'rocks', 'grass'])
  })

  it('przenosi warstwę niżej', () => {
    const result = moveLayer('rocks', 0).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['rocks', 'grass', 'trees'])
  })

  it('pozycja spoza listy jest przycinana', () => {
    const result = moveLayer('grass', 99).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['trees', 'rocks', 'grass'])
  })

  it('undo przywraca poprzednią kolejność', () => {
    const command = moveLayer('grass', 2)
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('nieznana warstwa: LAYER_NOT_FOUND', () => {
    expect(errorCode(() => moveLayer('missing', 0).apply(scene))).toBe('LAYER_NOT_FOUND')
  })
})
