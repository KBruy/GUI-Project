import { describe, expect, it } from 'vitest'
import { addObjects } from './add-objects'
import { layer, sceneWith, square } from './test-scene'

const tile = { id: 'map_terrain_grass_01', width: 32, height: 32 }
const scene = sceneWith([layer('grass', [square('a', 100, 100)])])

// 20 kafelków w rzędzie, co 32 px, z dala od obiektu a.
const row = Array.from({ length: 20 }, (_, i) => ({ x: 16 + i * 32, y: 400 }))

describe('addObjects', () => {
  it('stawia wszystkie kafelki jednym poleceniem', () => {
    const result = addObjects('grass', tile, row).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].objects).toHaveLength(21)
  })

  it('jedno undo usuwa wszystkie 20 kafelków', () => {
    const command = addObjects('grass', tile, row)
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('kafelki stykające się krawędziami nie kolidują ze sobą', () => {
    expect(addObjects('grass', tile, row.slice(0, 3)).apply(scene).ok).toBe(true)
  })

  it('kafelek nachodzący na wcześniejszy: kolizja i nic nie zostaje postawione', () => {
    const result = addObjects('grass', tile, [
      { x: 300, y: 300 },
      { x: 310, y: 300 },
    ]).apply(scene)
    expect(result.ok).toBe(false)
    expect(scene.layers[0].objects).toHaveLength(1)
  })
})
