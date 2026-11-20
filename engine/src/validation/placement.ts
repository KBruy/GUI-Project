import { MAX_ROTATION, MAX_SCALE, MIN_ROTATION, MIN_SCALE, type Scene } from '../types'
import { issue, type ValidationIssue } from './types'

/** Czy value leży w przedziale od low do high, z granicami włącznie (jak w backendzie). */
function inRange(value: number, low: number, high: number): boolean {
  return low <= value && value <= high
}

/** Sprawdza skalę, obrót i położenie każdego obiektu. */
export function checkPlacement(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const layer of scene.layers) {
    for (const object of layer.objects) {
      const where = { layerId: layer.id, objectId: object.id }
      // Jeden problem, nawet gdy obie skale są złe, jak w backendzie.
      if (
        !inRange(object.scaleX, MIN_SCALE, MAX_SCALE) ||
        !inRange(object.scaleY, MIN_SCALE, MAX_SCALE)
      ) {
        issues.push(issue('SCALE_OUT_OF_RANGE', where))
      }
      if (!inRange(object.rotation, MIN_ROTATION, MAX_ROTATION)) {
        issues.push(issue('ROTATION_OUT_OF_RANGE', where))
      }
      // Liczy się tylko środek (x, y), więc obiekt może częściowo wystawać poza scenę.
      if (!inRange(object.x, 0, scene.width) || !inRange(object.y, 0, scene.height)) {
        issues.push(issue('OBJECT_OUT_OF_BOUNDS', where))
      }
    }
  }
  return issues
}
