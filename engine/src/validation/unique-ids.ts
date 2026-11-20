import type { Scene } from '../types'
import { issue, type ValidationIssue } from './types'

/**
 * Sprawdza, czy id warstw i obiektów się nie powtarzają.
 * Warstwy i obiekty mają jedną wspólną pulę id.
 * Zgłasza każde kolejne wystąpienie id (pierwsze uznaje za poprawne), jak backend.
 */
export function checkUniqueIds(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  for (const layer of scene.layers) {
    if (seen.has(layer.id)) {
      issues.push(issue('DUPLICATE_ID', { layerId: layer.id }))
    }
    seen.add(layer.id)
    for (const object of layer.objects) {
      if (seen.has(object.id)) {
        issues.push(issue('DUPLICATE_ID', { layerId: layer.id, objectId: object.id }))
      }
      seen.add(object.id)
    }
  }
  return issues
}
