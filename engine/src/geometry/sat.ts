import type { Vec2 } from '../math/vec2'
import { EPSILON } from '../math/epsilon'
import type { Corners } from './corners'

/**
 * Oś długości 1 wzdłuż boku od punktu a do punktu b.
 * Zwraca null, gdy bok ma długość 0 (obiekt o zerowej szerokości lub wysokości):
 * dzielenie przez 0 dałoby NaN, a każde porównanie z NaN jest fałszywe.
 */
function edgeAxis(a: Vec2, b: Vec2): Vec2 | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (length < EPSILON) {
    return null
  }
  return { x: dx / length, y: dy / length }
}

/** Rzut narożników na oś: najmniejsza i największa pozycja „cienia” na tej osi. */
function project(corners: Corners, axis: Vec2): { min: number; max: number } {
  // Iloczyn skalarny: jak daleko punkt leży wzdłuż osi.
  const values = corners.map((c) => c.x * axis.x + c.y * axis.y)
  return { min: Math.min(...values), max: Math.max(...values) }
}

/**
 * Test SAT (Separating Axis Theorem) dla dwóch obróconych prostokątów.
 * Prostokąty NIE kolidują, jeśli istnieje oś, na której ich rzuty się nie nakładają.
 * Dla prostokątów wystarczą 4 osie: kierunki dwóch boków każdego z nich.
 */
export function satOverlap(a: Corners, b: Corners): boolean {
  const axes = [
    edgeAxis(a[0], a[1]),
    edgeAxis(a[1], a[2]),
    edgeAxis(b[0], b[1]),
    edgeAxis(b[1], b[2]),
  ]

  for (const axis of axes) {
    // Bok o długości 0 nie wyznacza kierunku, więc pomijamy tę oś.
    if (axis === null) {
      continue
    }
    const pa = project(a, axis)
    const pb = project(b, axis)
    // Przerwa na tej osi: znaleźliśmy oś rozdzielającą, więc nie ma kolizji.
    if (pa.max <= pb.min + EPSILON || pb.max <= pa.min + EPSILON) {
      return false
    }
  }
  // Rzuty nakładają się na każdej osi: prostokąty się przecinają.
  return true
}
