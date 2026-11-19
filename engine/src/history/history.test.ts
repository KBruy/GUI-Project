import { describe, expect, it } from 'vitest'
import { addObject } from '../commands/add-object'
import { addObjects } from '../commands/add-objects'
import { layer, sceneWith, square } from '../commands/test-scene'
import { transformObjects } from '../commands/transform-object'
import { canRedo, canUndo, emptyHistory, execute, redo, undo } from './history'

const tile = { id: 'map_terrain_grass_01', width: 32, height: 32 }
const start = sceneWith([layer('grass', [square('a', 100, 100), square('b', 200, 100)])])

// Wykonuje polecenie, które musi się udać, i zwraca nową historię i scenę.
function run(history = emptyHistory, scene = start, command = transformObjects(['a'], { x: 300 })) {
  const { history: next, result } = execute(history, scene, command)
  if (!result.ok) throw new Error('oczekiwano ok')
  return { history: next, scene: result.scene }
}

describe('history', () => {
  it('nowa historia: nie ma czego cofać ani ponawiać', () => {
    expect(canUndo(emptyHistory)).toBe(false)
    expect(canRedo(emptyHistory)).toBe(false)
  })

  it('cofnij po przesunięciu przywraca pozycję', () => {
    const moved = run()
    expect(moved.scene.layers[0].objects[0].x).toBe(300)
    const back = undo(moved.history, moved.scene)
    expect(back.scene).toEqual(start)
    expect(canUndo(back.history)).toBe(false)
    expect(canRedo(back.history)).toBe(true)
  })

  it('ponów przywraca cofniętą zmianę', () => {
    const moved = run()
    const back = undo(moved.history, moved.scene)
    const again = redo(back.history, back.scene)
    expect(again.scene).toEqual(moved.scene)
    expect(canRedo(again.history)).toBe(false)
  })

  it('cofa kroki od ostatniego do pierwszego', () => {
    const first = run()
    const second = run(first.history, first.scene, transformObjects(['b'], { y: 300 }))
    const back1 = undo(second.history, second.scene)
    expect(back1.scene).toEqual(first.scene)
    const back2 = undo(back1.history, back1.scene)
    expect(back2.scene).toEqual(start)
  })

  it('nowe polecenie po cofnięciu czyści ponów', () => {
    const moved = run()
    const back = undo(moved.history, moved.scene)
    const other = run(back.history, back.scene, transformObjects(['b'], { y: 300 }))
    expect(canRedo(other.history)).toBe(false)
  })

  it('polecenie z kolizją nie trafia do historii', () => {
    const { history, result } = execute(emptyHistory, start, transformObjects(['a'], { x: 195 }))
    expect(result).toEqual({ ok: false, collidesWith: ['b'] })
    expect(history).toBe(emptyHistory)
  })

  it('pędzel: 20 kafelków to jeden krok cofania', () => {
    const row = Array.from({ length: 20 }, (_, i) => ({ x: 16 + i * 32, y: 400 }))
    const painted = run(emptyHistory, start, addObjects('grass', tile, row))
    expect(painted.history.past).toHaveLength(1)
    expect(undo(painted.history, painted.scene).scene).toEqual(start)
  })

  it('trzy kliknięcia to trzy kroki cofania', () => {
    let state = { history: emptyHistory, scene: start }
    for (const x of [300, 400, 500]) {
      state = run(state.history, state.scene, addObject('grass', tile, { x, y: 300 }))
    }
    const back = undo(state.history, state.scene)
    expect(back.scene.layers[0].objects).toHaveLength(4)
  })

  it('cofnij i ponów przy pustych stosach nic nie zmieniają', () => {
    expect(undo(emptyHistory, start)).toEqual({ history: emptyHistory, scene: start })
    expect(redo(emptyHistory, start)).toEqual({ history: emptyHistory, scene: start })
  })
})
