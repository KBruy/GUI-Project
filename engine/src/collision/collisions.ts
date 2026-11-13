import { aabbOverlap, getAABB } from '../geometry/aabb'
import { getCorners, type Shape } from '../geometry/corners'
import { satOverlap } from '../geometry/sat'
import type { SceneObject } from '../types'

/**
 * Zwraca id obiektów z listy, na które nachodzi candidate.
 * Najpierw szybki odsiew przez AABB, dokładny test SAT tylko dla par, które mogą się przecinać.
 * Obiekty z ignoreIds są pomijane (np. przesuwany obiekt nie koliduje sam ze sobą).
 */
export function findCollisions(
  objects: readonly SceneObject[],
  candidate: Shape,
  ignoreIds: readonly string[] = []
): string[] {
  const corners = getCorners(candidate)
  const box = getAABB(corners)
  const hits: string[] = []

  for (const other of objects) {
    if (ignoreIds.includes(other.id)) {
      continue
    }
    const otherCorners = getCorners(other)
    // AABB się nie nakładają: na pewno nie ma kolizji, SAT nie jest potrzebny.
    if (!aabbOverlap(box, getAABB(otherCorners))) {
      continue
    }
    if (satOverlap(corners, otherCorners)) {
      hits.push(other.id)
    }
  }

  return hits
}
