import { render } from '@testing-library/react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { describe, expect, it } from 'vitest'
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

function renderLayer(objects: SceneObject[], marquee?: SelectionRect) {
  render(
    <Stage width={640} height={480}>
      <SelectionLayer objects={objects} marquee={marquee} />
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

  it('draws the marquee rectangle only when given', () => {
    expect(renderLayer([]).find('.selection-marquee')).toHaveLength(0)

    const marquee = renderLayer([], { x: 10, y: 20, width: 30, height: 40 }).findOne(
      '.selection-marquee'
    )
    expect(marquee?.attrs).toMatchObject({ x: 10, y: 20, width: 30, height: 40 })
  })

  it('does not catch clicks', () => {
    expect(renderLayer([TREE]).getLayers()[0].listening()).toBe(false)
  })
})
