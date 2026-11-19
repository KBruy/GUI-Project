import { findCollisions } from '../collision/collisions'
import type { Scene } from '../types'
import { issue, type ValidationIssue } from './types'

/**
 * Sprawdza kolizje na każdej warstwie (rozdz. 5.5: silnik zawsze, backend po prototypie).
 * Każdy obiekt porównuje z wcześniejszymi na tej samej warstwie, więc para kolidujących
 * obiektów daje jeden problem: przy tym, który jest dalej na liście.
 */
export function checkCollisions(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const layer of scene.layers) {
    layer.objects.forEach((object, index) => {
      const earlier = layer.objects.slice(0, index)
      if (findCollisions(earlier, object).length > 0) {
        issues.push(issue('COLLISION', { layerId: layer.id, objectId: object.id }))
      }
    })
  }
  return issues
}
