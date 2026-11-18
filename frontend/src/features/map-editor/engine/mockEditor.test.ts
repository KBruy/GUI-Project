import { describe, expect, it, vi } from 'vitest'
import type { Scene, SceneObject } from '@worldsmith/engine'
import { addObject, createEditor, moveObjects, transformObjects } from './mockEditor'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 64 }

function object(id: string, x: number, y: number): SceneObject {
  return { id, assetId: TREE.id, x, y, width: 64, height: 64, rotation: 0, scaleX: 1, scaleY: 1 }
}

function makeScene(): Scene {
  return {
    schemaVersion: 1,
    id: 'scene-1',
    type: 'map',
    name: 'Test',
    width: 640,
    height: 480,
    gridSize: 32,
    background: { color: '#7ec850' },
    layers: [
      {
        id: 'ground',
        name: 'Ziemia',
        visible: true,
        locked: false,
        objects: [object('a', 100, 100)],
      },
      {
        id: 'hidden',
        name: 'Ukryta',
        visible: false,
        locked: false,
        objects: [object('h', 300, 300)],
      },
    ],
    createdAt: '2026-11-10T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  }
}

describe('mock editor', () => {
  it('adds an object and notifies subscribers', () => {
    const editor = createEditor(makeScene())
    const listener = vi.fn()
    editor.subscribe(listener)

    expect(editor.execute(addObject('ground', TREE, { x: 300, y: 100 }))).toEqual({ ok: true })
    expect(editor.getScene().layers[0].objects).toHaveLength(2)
    expect(listener).toHaveBeenCalledWith(editor.getScene())
  })

  it('blocks adding on top of another object on the same layer', () => {
    const editor = createEditor(makeScene())
    const before = editor.getScene()

    expect(editor.execute(addObject('ground', TREE, { x: 120, y: 120 }))).toEqual({
      ok: false,
      collidesWith: ['a'],
    })
    expect(editor.getScene()).toBe(before)
  })

  it('treats touching edges as no collision', () => {
    const editor = createEditor(makeScene())
    // 'a' kończy się na x = 132, nowy obiekt zaczyna się dokładnie tam.
    expect(editor.execute(addObject('ground', TREE, { x: 164, y: 100 }))).toEqual({ ok: true })
  })

  it('reports collisions in canPlace without changing the scene', () => {
    const editor = createEditor(makeScene())
    editor.execute(addObject('ground', TREE, { x: 300, y: 100 }))
    const added = editor.getScene().layers[0].objects[1]

    expect(editor.canPlace(added.id, { x: 110 })).toEqual({ ok: false, collidesWith: ['a'] })
    expect(editor.canPlace(added.id, { x: 400 })).toEqual({ ok: true })
    expect(editor.getScene().layers[0].objects[1].x).toBe(300)
  })

  it('checks collisions of a rotated object by its rotated bounds', () => {
    const editor = createEditor(makeScene())
    // Kłoda 128×32 pod 'a' (y 164–196). Po obrocie o 90° sięga od y 116, czyli nachodzi na 'a' (do 132).
    editor.execute(addObject('ground', { id: 'log', width: 128, height: 32 }, { x: 100, y: 180 }))
    const log = editor.getScene().layers[0].objects[1]

    expect(editor.execute(transformObjects([log.id], { rotation: 90 }))).toEqual({
      ok: false,
      collidesWith: ['a'],
    })
    // Obrót o 180° to ten sam prostokąt co bez obrotu.
    expect(editor.execute(transformObjects([log.id], { rotation: 180 }))).toEqual({ ok: true })
  })

  it('undoes and redoes a move', () => {
    const editor = createEditor(makeScene())
    editor.execute(transformObjects(['a'], { x: 320, y: 128 }))
    expect(editor.getScene().layers[0].objects[0]).toMatchObject({ x: 320, y: 128 })

    editor.undo()
    expect(editor.getScene().layers[0].objects[0]).toMatchObject({ x: 100, y: 100 })

    editor.redo()
    expect(editor.getScene().layers[0].objects[0]).toMatchObject({ x: 320, y: 128 })
  })

  it('moves several objects by the same vector in one undo step', () => {
    const editor = createEditor(makeScene())
    editor.execute(addObject('ground', TREE, { x: 200, y: 100 }))
    const ids = editor.getScene().layers[0].objects.map((o) => o.id)

    // Obiekty stykają się krawędziami i jadą razem, więc nie kolidują ze sobą.
    expect(editor.execute(moveObjects(ids, { x: 32, y: 64 }))).toEqual({ ok: true })
    expect(editor.getScene().layers[0].objects).toMatchObject([
      { x: 132, y: 164 },
      { x: 232, y: 164 },
    ])

    editor.undo()
    expect(editor.getScene().layers[0].objects).toMatchObject([
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ])
  })

  it('checks a command with canExecute without changing the scene', () => {
    const editor = createEditor(makeScene())
    editor.execute(addObject('ground', TREE, { x: 300, y: 100 }))
    const before = editor.getScene()

    expect(editor.canExecute(moveObjects(['a'], { x: 180, y: 0 }))).toEqual({
      ok: false,
      collidesWith: [before.layers[0].objects[1].id],
    })
    expect(editor.canExecute(moveObjects(['a'], { x: 0, y: 200 }))).toEqual({ ok: true })
    expect(editor.getScene()).toBe(before)
  })

  it('snaps a point to the nearest grid point', () => {
    const editor = createEditor(makeScene())
    expect(editor.snapToGrid({ x: 47, y: 50 })).toEqual({ x: 32, y: 64 })
  })

  it('selects objects in a rectangle only on visible layers', () => {
    const editor = createEditor(makeScene())
    expect(editor.objectsInRect({ x: 0, y: 0, width: 640, height: 480 })).toEqual(['a'])
  })
})
