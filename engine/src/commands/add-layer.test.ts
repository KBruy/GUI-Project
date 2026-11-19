import { describe, expect, it } from 'vitest'
import { addLayer } from './add-layer'
import { errorCode, layer, sceneWith } from './test-scene'

const scene = sceneWith([layer('grass', [])])

describe('addLayer', () => {
  it('dodaje pustą warstwę na wierzchu', () => {
    const result = addLayer('Drzewa').apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers).toHaveLength(2)
    expect(result.scene.layers[1].name).toBe('Drzewa')
    expect(result.scene.layers[1].objects).toHaveLength(0)
  })

  it('undo usuwa dodaną warstwę', () => {
    const command = addLayer('Drzewa')
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('11. warstwa jest odrzucana kodem LAYER_LIMIT', () => {
    const full = sceneWith(Array.from({ length: 10 }, (_, i) => layer(`l${i}`, [])))
    expect(errorCode(() => addLayer('Za dużo').apply(full))).toBe('LAYER_LIMIT')
  })
})
