import { describe, expect, it } from 'vitest'
import { addObject } from '../commands/add-object'
import { errorCode, layer, sceneWith, square } from '../commands/test-scene'
import { transformObjects } from '../commands/transform-object'
import type { Scene } from '../types'
import { createEditor } from './editor'

const start = sceneWith([layer('l1', [square('a', 100, 100), square('b', 200, 100)])])
const xOf = (scene: Scene, index: number) => scene.layers[0].objects[index].x

describe('createEditor', () => {
  it('na start zwraca podaną scenę', () => {
    expect(createEditor(start).getScene()).toBe(start)
  })

  it('execute zmienia scenę i powiadamia słuchaczy', () => {
    const editor = createEditor(start)
    const seen: Scene[] = []
    editor.subscribe((scene) => seen.push(scene))
    expect(editor.execute(transformObjects(['a'], { x: 300 }))).toEqual({ ok: true })
    expect(xOf(editor.getScene(), 0)).toBe(300)
    expect(seen).toEqual([editor.getScene()])
  })

  it('przy kolizji zwraca kolidujące id i niczego nie zmienia', () => {
    const editor = createEditor(start)
    let calls = 0
    editor.subscribe(() => calls++)
    const result = editor.execute(transformObjects(['a'], { x: 205 }))
    expect(result).toEqual({ ok: false, collidesWith: ['b'] })
    expect(editor.getScene()).toBe(start)
    expect(calls).toBe(0)
    // Nieudana próba nie trafiła do historii, więc nie ma czego cofać.
    editor.undo()
    expect(editor.getScene()).toBe(start)
  })

  it('undo i redo cofają i ponawiają polecenie', () => {
    const editor = createEditor(start)
    editor.execute(transformObjects(['a'], { x: 300 }))
    editor.undo()
    expect(editor.getScene()).toEqual(start)
    editor.redo()
    expect(xOf(editor.getScene(), 0)).toBe(300)
  })

  it('undo bez historii i redo bez cofnięć nie powiadamiają słuchaczy', () => {
    const editor = createEditor(start)
    let calls = 0
    editor.subscribe(() => calls++)
    editor.undo()
    editor.redo()
    expect(calls).toBe(0)
  })

  it('canUndo i canRedo mówią, czy przyciski mają być aktywne', () => {
    const editor = createEditor(start)
    expect(editor.canUndo()).toBe(false)
    expect(editor.canRedo()).toBe(false)
    const seen: boolean[] = []
    editor.subscribe(() => seen.push(editor.canUndo()))
    editor.execute(transformObjects(['a'], { x: 300 }))
    expect(editor.canUndo()).toBe(true)
    editor.undo()
    expect(editor.canUndo()).toBe(false)
    expect(editor.canRedo()).toBe(true)
    // Słuchacz dostaje powiadomienie, gdy historia jest już zmieniona.
    expect(seen).toEqual([true, false])
  })

  it('po wypisaniu słuchacz nie dostaje zmian', () => {
    const editor = createEditor(start)
    let calls = 0
    const unsubscribe = editor.subscribe(() => calls++)
    unsubscribe()
    editor.execute(transformObjects(['a'], { x: 300 }))
    expect(calls).toBe(0)
  })

  it('canExecute podaje wynik, ale nie zmienia sceny ani historii', () => {
    const editor = createEditor(start)
    expect(editor.canExecute(transformObjects(['a'], { x: 300 }))).toEqual({ ok: true })
    expect(editor.canExecute(transformObjects(['a'], { x: 205 }))).toEqual({
      ok: false,
      collidesWith: ['b'],
    })
    expect(editor.getScene()).toBe(start)
    editor.undo()
    expect(editor.getScene()).toBe(start)
  })

  it('canPlace sprawdza bieżącą scenę', () => {
    const editor = createEditor(start)
    expect(editor.canPlace('a', { x: 205 })).toEqual({ ok: false, collidesWith: ['b'] })
    editor.execute(transformObjects(['b'], { x: 400 }))
    expect(editor.canPlace('a', { x: 205 })).toEqual({ ok: true })
  })

  it('snapToGrid przyciąga do siatki sceny', () => {
    expect(createEditor(start).snapToGrid({ x: 40, y: 70 })).toEqual({ x: 32, y: 64 })
  })

  it('objectsInRect szuka w bieżącej scenie', () => {
    const editor = createEditor(start)
    editor.execute(addObject('l1', { id: 'tile', width: 32, height: 32 }, { x: 300, y: 300 }))
    expect(editor.objectsInRect({ x: 0, y: 0, width: 640, height: 480 })).toHaveLength(3)
  })

  it('błąd polecenia leci dalej, a scena zostaje bez zmian', () => {
    const editor = createEditor(sceneWith([layer('l1', [square('a', 100, 100)], true)]))
    const before = editor.getScene()
    expect(errorCode(() => editor.execute(transformObjects(['a'], { x: 300 })))).toBe(
      'LAYER_LOCKED'
    )
    expect(editor.getScene()).toBe(before)
  })
})
