import { describe, expect, it } from 'vitest'
import { addObject } from './add-object'
import { combineCommands } from './combine'
import { moveObjects } from './move-object'
import { layer, sceneWith, square } from './test-scene'
import { transformObjects } from './transform-object'

const tile = { id: 'map_terrain_grass_01', width: 32, height: 32 }
const scene = sceneWith([layer('grass', [square('a', 100, 100)])])

describe('combineCommands', () => {
  it('wykonuje polecenia po kolei, każde na wyniku poprzedniego', () => {
    const command = combineCommands([
      transformObjects(['a'], { rotation: 90 }),
      moveObjects(['a'], { x: 10, y: 0 }),
    ])
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const [a] = result.scene.layers[0].objects
    expect(a.rotation).toBe(90)
    expect(a.x).toBe(110)
  })

  it('jedno undo cofa wszystkie polecenia naraz', () => {
    const command = combineCommands([
      addObject('grass', tile, { x: 300, y: 300 }),
      addObject('grass', tile, { x: 400, y: 300 }),
      moveObjects(['a'], { x: 10, y: 0 }),
    ])
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(result.scene.layers[0].objects).toHaveLength(3)
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('wszystko albo nic: kolizja w środku zostawia scenę bez zmian', () => {
    const command = combineCommands([
      addObject('grass', tile, { x: 300, y: 300 }),
      addObject('grass', tile, { x: 110, y: 100 }),
    ])
    expect(command.apply(scene)).toEqual({ ok: false, collidesWith: ['a'] })
    expect(scene.layers[0].objects).toHaveLength(1)
  })

  it('pusta lista nic nie zmienia', () => {
    expect(combineCommands([]).apply(scene)).toEqual({ ok: true, scene })
  })
})
