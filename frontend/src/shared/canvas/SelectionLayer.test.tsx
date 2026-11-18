import { render } from '@testing-library/react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { describe, expect, it, vi } from 'vitest'
import type { SceneObject } from '@worldsmith/engine'
import { SelectionLayer, type SelectionRect } from './SelectionLayer'

const TREE: SceneObject = {
  id: 'obj-1',
  assetId: 'map_tree_oak_01',
  x: 100,
  y: 80,
  width: 64,
  height: 96,
  rotation: 90,
  scaleX: 2,
  scaleY: 1,
}

function renderLayer(objects: SceneObject[], marquee?: SelectionRect, collisions?: SceneObject[]) {
  render(
    <Stage width={640} height={480}>
      <SelectionLayer objects={objects} marquee={marquee} collisions={collisions} />
    </Stage>
  )
  return Konva.stages.at(-1)!
}

describe('SelectionLayer', () => {
  it('draws a frame matching the object position, rotation and scale', () => {
    const frames = renderLayer([TREE]).find('.selection-frame')

    expect(frames).toHaveLength(1)
    expect(frames[0].attrs).toMatchObject({
      x: 100,
      y: 80,
      offsetX: 32,
      offsetY: 48,
      rotation: 90,
      scaleX: 2,
    })
  })

  it('draws one dot of constant screen size at the given point, none without it', () => {
    expect(renderLayer([TREE]).find('.selection-center')).toHaveLength(0)

    render(
      <Stage width={640} height={480}>
        <SelectionLayer objects={[TREE, { ...TREE, id: 'obj-2', x: 300 }]} center={TREE} zoom={2} />
      </Stage>
    )
    const dots = Konva.stages.at(-1)!.find('.selection-center')

    // Jedna kropka, choć zaznaczone są dwa obiekty.
    expect(dots).toHaveLength(1)
    // 8 px na ekranie przy zoomie 2 to 4 punkty sceny, wyśrodkowane na podanym punkcie.
    expect(dots[0].attrs).toMatchObject({ x: 100, y: 80, width: 4, height: 4, offsetX: 2 })
  })

  it('draws the marquee rectangle only when given', () => {
    expect(renderLayer([]).find('.selection-marquee')).toHaveLength(0)

    const marquee = renderLayer([], { x: 10, y: 20, width: 30, height: 40 }).findOne(
      '.selection-marquee'
    )
    expect(marquee?.attrs).toMatchObject({ x: 10, y: 20, width: 30, height: 40 })
  })

  it('turns every frame amber when there are collisions', () => {
    const rock = { ...TREE, id: 'obj-2', x: 300 }
    expect(renderLayer([TREE]).findOne('.selection-frame')?.attrs.stroke).toBe('#ff1f4b')

    const frames = renderLayer([TREE], undefined, [rock]).find('.selection-frame')
    expect(frames.map((frame) => frame.attrs.stroke)).toEqual(['#ffc21f', '#ffc21f'])
  })

  it('shakes the frames when shakeKey changes', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <Stage width={640} height={480}>
        <SelectionLayer objects={[TREE]} />
      </Stage>
    )
    const layer = Konva.stages.at(-1)!.getLayers()[0]

    rerender(
      <Stage width={640} height={480}>
        <SelectionLayer objects={[TREE]} shakeKey={1} />
      </Stage>
    )
    vi.advanceTimersByTime(40)
    expect(layer.x()).toBe(-4)
    vi.advanceTimersByTime(120)
    expect(layer.x()).toBe(0)
    vi.useRealTimers()
  })

  it('does not catch clicks', () => {
    expect(renderLayer([TREE]).getLayers()[0].listening()).toBe(false)
  })
})
