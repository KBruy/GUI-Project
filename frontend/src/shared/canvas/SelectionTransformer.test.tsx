import { act, render } from '@testing-library/react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { describe, expect, it, vi } from 'vitest'
import type { SceneObject } from '@worldsmith/engine'
import { SelectionTransformer } from './SelectionTransformer'

// Kłoda 128×32 na środku mapy 640×480.
const LOG: SceneObject = {
  id: 'obj-1',
  assetId: 'map_log_01',
  x: 320,
  y: 240,
  width: 128,
  height: 32,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
}

function setup() {
  const onTransform = vi.fn()
  const onTransformEnd = vi.fn()
  render(
    <Stage width={640} height={480}>
      <SelectionTransformer
        object={LOG}
        bounds={{ width: 640, height: 480 }}
        scaleLimits={{ min: 0.1, max: 4 }}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
      />
    </Stage>
  )
  const stage = Konva.stages.at(-1)!
  const transformer = stage.findOne<Konva.Transformer>('Transformer')!
  return { transformer, shape: transformer.nodes()[0], onTransform, onTransformEnd }
}

describe('SelectionTransformer', () => {
  it('attaches the handles to a shape of the object', () => {
    const { transformer, shape } = setup()

    expect(transformer.nodes()).toHaveLength(1)
    expect(shape.attrs).toMatchObject({ x: 320, y: 240, offsetX: 64, offsetY: 16, rotation: 0 })
  })

  it('reports the transform while it lasts and at the end, then goes back to the object', () => {
    const { transformer, shape, onTransform, onTransformEnd } = setup()

    // Konva zmienia prostokąt sama, tu robimy to ręcznie i wysyłamy jej zdarzenia.
    act(() => {
      shape.setAttrs({ rotation: 90, scaleX: 1.5 })
      transformer.fire('transform')
    })
    expect(onTransform).toHaveBeenLastCalledWith({
      x: 320,
      y: 240,
      rotation: 90,
      scaleX: 1.5,
      scaleY: 1,
    })

    act(() => {
      transformer.fire('transformend')
    })
    expect(onTransformEnd).toHaveBeenCalledWith(expect.objectContaining({ rotation: 90 }))
    // Scenę zmienia ten, kto używa komponentu. Prostokąt wraca do obiektu z propsów.
    expect(shape.attrs).toMatchObject({ rotation: 0, scaleX: 1 })
  })

  it('stops the box at the map edge, even after a fast jump past it', () => {
    const { transformer } = setup()
    const limit = transformer.boundBoxFunc()!
    const old = { x: 256, y: 224, width: 128, height: 32, rotation: 0 }

    // Obrót o 90° na środku mapy mieści się w niej.
    const turned = { x: 336, y: 176, width: 128, height: 32, rotation: Math.PI / 2 }
    expect(limit(old, turned)).toBe(turned)
    // Rozciągnięcie do x = 700 wychodzi za prawą krawędź (640): pudełko dochodzi do krawędzi,
    // a lewy bok zostaje na miejscu.
    const stopped = limit(old, { ...old, width: 444 })
    expect(stopped.x).toBe(256)
    expect(stopped.x + stopped.width).toBeGreaterThan(639.5)
    expect(stopped.x + stopped.width).toBeLessThanOrEqual(640.5)
  })

  it('stops the box at the scale limits', () => {
    const { transformer } = setup()
    const limit = transformer.boundBoxFunc()!
    const old = { x: 256, y: 224, width: 128, height: 32, rotation: 0 }

    // Kłoda ma 32 px wysokości, a limit to 4×, czyli 128 px.
    const atMax = { ...old, height: 128 }
    expect(limit(old, atMax)).toBe(atMax)
    expect(limit(old, { ...old, height: 200 }).height).toBeCloseTo(128, 0)
    // 0,1 z 32 px to 3,2 px, więc 2 px jest już za mało.
    expect(limit(old, { ...old, height: 2 }).height).toBeCloseTo(3.2, 0)
  })

  it('keeps following the cursor on one axis when the other is at its limit', () => {
    const { transformer } = setup()
    const limit = transformer.boundBoxFunc()!
    const old = { x: 256, y: 224, width: 128, height: 32, rotation: 0 }

    // Prawy górny róg w górę i w prawo: wysokość 156 px to ponad 4×, a dolny bok (256) stoi.
    const box = limit(old, { x: 256, y: 100, width: 200, height: 156, rotation: 0 })
    // Szerokość idzie za kursorem, wysokość staje na 128 px, a lewy i dolny bok zostają.
    expect(box.width).toBeCloseTo(200)
    expect(box.height).toBeCloseTo(128)
    expect(box.x).toBeCloseTo(256)
    expect(box.y + box.height).toBeCloseTo(256)
  })
})
