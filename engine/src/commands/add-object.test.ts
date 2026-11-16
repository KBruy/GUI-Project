import { describe, expect, it } from 'vitest'
import { EngineError } from '../errors'
import { addObject } from './add-object'
import { layer, sceneWith, square } from './test-scene'

const tree = { id: 'map_tree_oak_01', width: 20, height: 20 }
const scene = sceneWith([layer('grass', [square('a', 100, 100)]), layer('trees', [])])

describe('addObject', () => {
  it('stawia obiekt z assetu na podanej warstwie', () => {
    const result = addObject('trees', tree, { x: 300, y: 200 }).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    const added = result.scene.layers[1].objects[0]
    expect(added.assetId).toBe('map_tree_oak_01')
    expect(added.x).toBe(300)
    expect(added.y).toBe(200)
    expect(added.rotation).toBe(0)
    expect(added.scaleX).toBe(1)
  })

  it('nie zmienia sceny, którą dostał', () => {
    addObject('trees', tree, { x: 300, y: 200 }).apply(scene)
    expect(scene.layers[1].objects).toHaveLength(0)
  })

  it('przy kolizji na tej samej warstwie zwraca id kolidujących', () => {
    const result = addObject('grass', tree, { x: 110, y: 100 }).apply(scene)
    expect(result).toEqual({ ok: false, collidesWith: ['a'] })
  })

  it('obiekt z innej warstwy nie przeszkadza', () => {
    expect(addObject('trees', tree, { x: 100, y: 100 }).apply(scene).ok).toBe(true)
  })

  it('undo usuwa dodany obiekt', () => {
    const command = addObject('trees', tree, { x: 300, y: 200 })
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('ponowne apply stawia obiekt z tym samym id (ponów)', () => {
    const command = addObject('trees', tree, { x: 300, y: 200 })
    const first = command.apply(scene)
    const second = command.apply(scene)
    if (!first.ok || !second.ok) throw new Error('oczekiwano ok')
    expect(second.scene.layers[1].objects[0].id).toBe(first.scene.layers[1].objects[0].id)
  })

  it('nieznana warstwa: EngineError z kodem LAYER_NOT_FOUND', () => {
    let caught: unknown
    try {
      addObject('missing', tree, { x: 0, y: 0 }).apply(scene)
    } catch (error) {
      caught = error
    }
    expect(caught instanceof EngineError).toBe(true)
    expect((caught as EngineError).code).toBe('LAYER_NOT_FOUND')
  })
})
