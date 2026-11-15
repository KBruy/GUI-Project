import { render } from '@testing-library/react'
import Konva from 'konva'
import { describe, expect, it } from 'vitest'
import type { Scene, SceneObject } from '@worldsmith/engine'
import { SceneRenderer } from './SceneRenderer'

function makeObject(id: string, extra: Partial<SceneObject> = {}): SceneObject {
  return {
    id,
    assetId: 'map_tree_oak_01',
    x: 100,
    y: 50,
    width: 64,
    height: 32,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    ...extra,
  }
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
      { id: 'ground', name: 'Ziemia', visible: true, locked: false, objects: [makeObject('a')] },
      { id: 'hidden', name: 'Ukryta', visible: false, locked: false, objects: [makeObject('b')] },
      {
        id: 'top',
        name: 'Góra',
        visible: true,
        locked: false,
        objects: [makeObject('c', { rotation: 90, scaleX: 2, scaleY: 0.5 })],
      },
    ],
    createdAt: '2026-11-15T00:00:00Z',
    updatedAt: '2026-11-15T00:00:00Z',
  }
}

// SceneRenderer nie wystawia Stage na zewnątrz, więc bierzemy ostatni utworzony.
function renderScene(scene: Scene) {
  render(<SceneRenderer scene={scene} width={640} height={480} />)
  return Konva.stages.at(-1)!
}

describe('SceneRenderer', () => {
  it('draws the background and visible layers from lowest to highest', () => {
    const stage = renderScene(makeScene())

    // Pierwsza warstwa Konvy to tło, potem warstwy sceny w kolejności z tablicy.
    expect(stage.getLayers().map((layer) => layer.id())).toEqual(['', 'ground', 'top'])
  })

  it('skips objects from hidden layers', () => {
    const stage = renderScene(makeScene())

    expect(stage.findOne('#a')).toBeDefined()
    expect(stage.findOne('#b')).toBeUndefined()
  })

  it('places the object by its center with rotation and scale from data', () => {
    const stage = renderScene(makeScene())
    const node = stage.findOne('#c')!

    expect(node.position()).toEqual({ x: 100, y: 50 })
    expect(node.offset()).toEqual({ x: 32, y: 16 })
    expect(node.rotation()).toBe(90)
    expect(node.scale()).toEqual({ x: 2, y: 0.5 })
  })
})
