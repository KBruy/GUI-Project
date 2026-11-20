import { CHARACTER_HEIGHT, CHARACTER_WIDTH, isAllowedMapSize } from '../scene/create'
import { MAX_LAYERS, SCHEMA_VERSION, type Scene } from '../types'
import { issue, type ValidationIssue } from './types'

/** Czy rozmiar płótna jest dozwolony dla typu sceny (jak ALLOWED_SCENE_SIZES w backendzie). */
function isAllowedSize(scene: Scene): boolean {
  if (scene.type === 'map') {
    return isAllowedMapSize(scene)
  }
  return scene.width === CHARACTER_WIDTH && scene.height === CHARACTER_HEIGHT
}

/** Sprawdza pola całej sceny: wersję schematu, nazwę, rozmiar płótna i liczbę warstw. */
export function checkSceneFields(scene: Scene): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (scene.schemaVersion !== SCHEMA_VERSION) {
    issues.push(issue('UNSUPPORTED_SCHEMA_VERSION'))
  }
  // Nazwa z samych spacji liczy się jako pusta.
  if (scene.name.trim() === '') {
    issues.push(issue('NAME_REQUIRED'))
  }
  if (!isAllowedSize(scene)) {
    issues.push(issue('INVALID_SCENE_SIZE'))
  }
  if (scene.layers.length > MAX_LAYERS) {
    issues.push(issue('LAYER_LIMIT'))
  }
  return issues
}
