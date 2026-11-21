import type { Vec2 } from '../math/vec2'
import { GRID_SIZE } from '../types'

/** Najbliższy punkt siatki, osobno w każdej osi (jak snapToGrid w zaślepce frontendu). */
export function snapToGrid(point: Vec2, gridSize = GRID_SIZE): Vec2 {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  }
}

/**
 * Środek obiektu przesunięty tak, żeby jego lewy górny róg leżał na siatce.
 * Tak przyciąga frontend (frontend/docs/CANVAS.md): obiekt 32 × 32 wypełnia jedno pole,
 * a większe obiekty stoją równo na liniach siatki. width i height to rozmiar na scenie.
 */
export function snapCenter(
  center: Vec2,
  width: number,
  height: number,
  gridSize = GRID_SIZE
): Vec2 {
  const corner = snapToGrid({ x: center.x - width / 2, y: center.y - height / 2 }, gridSize)
  return { x: corner.x + width / 2, y: corner.y + height / 2 }
}
