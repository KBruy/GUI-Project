import { EngineError } from '../errors'
import type { Scene } from '../types'
import { findCollisions } from './collisions'
import type { PlaceResult, Transform } from './types'

/**
 * Czy obiekt o podanym id można przesunąć, obrócić lub przeskalować do podanych wartości.
 * Niczego nie zmienia w scenie, więc frontend może pytać przy każdym ruchu myszy (podgląd).
 * Sprawdza kolizje tylko z obiektami z tej samej warstwy.
 * Rzuca EngineError('OBJECT_NOT_FOUND'), gdy obiektu nie ma w scenie.
 */
export function canPlace(
  scene: Scene,
  objectId: string,
  transform: Partial<Transform>
): PlaceResult {
  for (const layer of scene.layers) {
    const object = layer.objects.find((candidate) => candidate.id === objectId)
    if (object === undefined) {
      continue
    }
    const moved = { ...object, ...transform }
    const collidesWith = findCollisions(layer.objects, moved, [objectId])
    return collidesWith.length > 0 ? { ok: false, collidesWith } : { ok: true }
  }
  throw new EngineError('OBJECT_NOT_FOUND')
}
