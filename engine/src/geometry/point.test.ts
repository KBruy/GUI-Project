import { describe, expect, it } from 'vitest'
import type { Shape } from './corners'
import { pointInShape } from './point'

// Prostokąt 40 × 20 ze środkiem w (100, 100): od x 80 do 120, od y 90 do 110.
const rect: Shape = { x: 100, y: 100, width: 40, height: 20, rotation: 0, scaleX: 1, scaleY: 1 }

describe('pointInShape', () => {
  it('środek obiektu jest w środku', () => {
    expect(pointInShape({ x: 100, y: 100 }, rect)).toBe(true)
  })

  it('punkt poza obiektem nie jest w środku', () => {
    expect(pointInShape({ x: 130, y: 100 }, rect)).toBe(false)
  })

  it('punkt na krawędzi liczy się jako w środku', () => {
    expect(pointInShape({ x: 120, y: 100 }, rect)).toBe(true)
  })

  it('krawędź obróconego obiektu też liczy się jako w środku', () => {
    expect(pointInShape({ x: 100, y: 120 }, { ...rect, rotation: 90 })).toBe(true)
  })

  it('uwzględnia skalę', () => {
    expect(pointInShape({ x: 130, y: 100 }, { ...rect, scaleX: 2 })).toBe(true)
  })

  it('uwzględnia obrót: po 90° prostokąt jest wysoki zamiast szeroki', () => {
    const rotated = { ...rect, rotation: 90 }
    expect(pointInShape({ x: 100, y: 115 }, rect)).toBe(false)
    expect(pointInShape({ x: 100, y: 115 }, rotated)).toBe(true)
    expect(pointInShape({ x: 115, y: 100 }, rect)).toBe(true)
    expect(pointInShape({ x: 115, y: 100 }, rotated)).toBe(false)
  })
})
