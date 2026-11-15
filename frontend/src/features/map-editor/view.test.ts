import { describe, expect, it } from 'vitest'
import { clampOffset, clampZoom, fitView, zoomAt } from './view'

const SCENE = { width: 640, height: 480 }
const VIEWPORT = { width: 800, height: 600 }

describe('view', () => {
  it('keeps zoom between 25% and 400%', () => {
    expect(clampZoom(0.1)).toBe(0.25)
    expect(clampZoom(10)).toBe(4)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('keeps the scene point under the cursor in place when zooming', () => {
    const view = { zoom: 1, offset: { x: 100, y: 50 } }
    const cursor = { x: 300, y: 250 }
    // Pod kursorem jest punkt sceny (200, 200).

    const next = zoomAt(view, cursor, 2)

    expect(next.zoom).toBe(2)
    expect(next.offset.x + 200 * next.zoom).toBe(cursor.x)
    expect(next.offset.y + 200 * next.zoom).toBe(cursor.y)
  })

  it('clamps zoom while zooming at a point', () => {
    expect(zoomAt({ zoom: 4, offset: { x: 0, y: 0 } }, { x: 0, y: 0 }, 8).zoom).toBe(4)
  })

  it('fits the whole scene centered in the viewport', () => {
    const view = fitView(SCENE, VIEWPORT)

    // (800 - 64) / 640 = 1.15 i (600 - 64) / 480 ≈ 1.117, więc decyduje wysokość.
    expect(view.zoom).toBeCloseTo(536 / 480)
    expect(view.offset.x * 2 + SCENE.width * view.zoom).toBeCloseTo(VIEWPORT.width)
    expect(view.offset.y * 2 + SCENE.height * view.zoom).toBeCloseTo(VIEWPORT.height)
  })

  it('does not let the scene leave the viewport', () => {
    expect(clampOffset({ x: 5000, y: -5000 }, 1, SCENE, VIEWPORT)).toEqual({
      x: 800 - 64,
      y: 64 - 480,
    })
    expect(clampOffset({ x: 10, y: 20 }, 1, SCENE, VIEWPORT)).toEqual({ x: 10, y: 20 })
  })
})
