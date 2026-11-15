import { render } from '@testing-library/react'
import Konva from 'konva'
import { Stage } from 'react-konva'
import { describe, expect, it } from 'vitest'
import { GridLayer } from './GridLayer'

// Zapisuje wywołania moveTo, żeby policzyć narysowane linie bez prawdziwego canvasu.
function drawnLines(width: number, height: number, size: number) {
  render(
    <Stage width={width} height={height}>
      <GridLayer width={width} height={height} size={size} />
    </Stage>
  )
  const shape = Konva.stages.at(-1)!.findOne('Shape') as Konva.Shape
  const starts: [number, number][] = []
  const context = {
    beginPath() {},
    lineTo() {},
    strokeShape() {},
    moveTo: (x: number, y: number) => starts.push([x, y]),
  }
  shape.sceneFunc()(context as unknown as Konva.Context, shape)
  return starts
}

describe('GridLayer', () => {
  it('draws a line every grid size across the whole scene, edges included', () => {
    const starts = drawnLines(640, 480, 32)

    // 640 / 32 + 1 = 21 pionowych i 480 / 32 + 1 = 16 poziomych.
    expect(starts).toHaveLength(21 + 16)
    expect(starts).toContainEqual([640, 0])
    expect(starts).toContainEqual([0, 480])
  })

  it('does not catch clicks', () => {
    drawnLines(64, 64, 32)

    expect(Konva.stages.at(-1)!.getLayers()[0].listening()).toBe(false)
  })
})
