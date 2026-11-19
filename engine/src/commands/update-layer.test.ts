import { describe, expect, it } from 'vitest'
import { errorCode, layer, sceneWith } from './test-scene'
import { updateLayer } from './update-layer'

const scene = sceneWith([layer('grass', []), layer('body', [], true)])

describe('updateLayer', () => {
  it('zmienia nazwę i zostawia pozostałe pola', () => {
    const result = updateLayer('grass', { name: 'Trawa' }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].name).toBe('Trawa')
    expect(result.scene.layers[0].visible).toBe(true)
  })

  it('ukrywa warstwę', () => {
    const result = updateLayer('grass', { visible: false }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].visible).toBe(false)
  })

  it('odblokowuje zablokowaną warstwę', () => {
    const result = updateLayer('body', { locked: false }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[1].locked).toBe(false)
  })

  it('undo przywraca poprzednie wartości', () => {
    const command = updateLayer('grass', { name: 'Trawa', visible: false, locked: true })
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('nieznana warstwa: LAYER_NOT_FOUND', () => {
    const command = updateLayer('missing', { name: 'x' })
    expect(errorCode(() => command.apply(scene))).toBe('LAYER_NOT_FOUND')
  })
})
