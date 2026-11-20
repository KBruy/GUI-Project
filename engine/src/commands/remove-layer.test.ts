import { describe, expect, it } from 'vitest'
import { removeLayer } from './remove-layer'
import { errorCode, layer, sceneWith, square } from './test-scene'

const scene = sceneWith([
  layer('grass', [square('a', 100, 100)]),
  layer('trees', [square('tree', 200, 200)]),
  layer('rocks', []),
])

describe('removeLayer', () => {
  it('usuwa warstwę razem z jej obiektami', () => {
    const result = removeLayer('trees').apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers.map((l) => l.id)).toEqual(['grass', 'rocks'])
  })

  it('undo wstawia warstwę z obiektami na to samo miejsce', () => {
    const command = removeLayer('trees')
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('nieznana warstwa: LAYER_NOT_FOUND', () => {
    expect(errorCode(() => removeLayer('missing').apply(scene))).toBe('LAYER_NOT_FOUND')
  })

  it('zablokowana warstwa: LAYER_LOCKED', () => {
    const locked = sceneWith([layer('body', [], true), layer('hair', [])])
    expect(errorCode(() => removeLayer('body').apply(locked))).toBe('LAYER_LOCKED')
  })

  it('ostatnia warstwa: LAST_LAYER', () => {
    const single = sceneWith([layer('grass', [])])
    expect(errorCode(() => removeLayer('grass').apply(single))).toBe('LAST_LAYER')
  })
})
