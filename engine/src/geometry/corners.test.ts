import { describe, expect, it } from 'vitest'
import { getCorners, type Shape } from './corners'

const base: Shape = { x: 100, y: 100, width: 40, height: 20, rotation: 0, scaleX: 1, scaleY: 1 }

describe('getCorners', () => {
  it('bez obrotu zwraca narożniki wokół środka', () => {
    expect(getCorners(base)).toEqual([
      { x: 80, y: 90 },
      { x: 120, y: 90 },
      { x: 120, y: 110 },
      { x: 80, y: 110 },
    ])
  })

  it('uwzględnia skalę', () => {
    const [topLeft, , bottomRight] = getCorners({ ...base, scaleX: 2, scaleY: 0.5 })
    expect(topLeft).toEqual({ x: 60, y: 95 })
    expect(bottomRight).toEqual({ x: 140, y: 105 })
  })

  it('obrót o 90° zamienia szerokość z wysokością', () => {
    const [topLeft, , bottomRight] = getCorners({ ...base, rotation: 90 })
    expect(topLeft.x).toBeCloseTo(110)
    expect(topLeft.y).toBeCloseTo(80)
    expect(bottomRight.x).toBeCloseTo(90)
    expect(bottomRight.y).toBeCloseTo(120)
  })
})
