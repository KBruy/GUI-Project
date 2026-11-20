import type { Scene } from '../types'
import { checkCollisions } from './collisions'
import { checkPlacement } from './placement'
import { checkSceneFields } from './scene-fields'
import type { ValidationIssue } from './types'
import { checkUniqueIds } from './unique-ids'

/**
 * Sprawdza wszystkie reguły poprawności sceny (rozdz. 5.5) i zwraca wszystkie problemy naraz.
 * Pusta lista oznacza scenę poprawną. Niczego nie zmienia w scenie.
 * Bez sprawdzania assetów: robi to backend, który zna bibliotekę assetów.
 */
export function validateScene(scene: Scene): ValidationIssue[] {
  return [
    ...checkSceneFields(scene),
    ...checkUniqueIds(scene),
    ...checkPlacement(scene),
    ...checkCollisions(scene),
  ]
}
