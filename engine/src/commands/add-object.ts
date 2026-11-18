import { findCollisions } from '../collision/collisions'
import { EngineError } from '../errors'
import { newId } from '../ids'
import type { Vec2 } from '../math/vec2'
import type { SceneObject } from '../types'
import type { AssetSize, Command } from './types'

/**
 * Polecenie: postaw nowy obiekt z assetu na warstwie, ze środkiem w punkcie `at`.
 * Przy kolizji z obiektem z tej warstwy zwraca { ok: false, collidesWith }.
 * Rzuca EngineError('LAYER_NOT_FOUND'), gdy warstwy nie ma w scenie.
 */
export function addObject(layerId: string, asset: AssetSize, at: Vec2): Command {
  // Id powstaje raz, przy tworzeniu polecenia, więc ponów (redo) stawia ten sam obiekt.
  const object: SceneObject = {
    id: newId('obj'),
    assetId: asset.id,
    x: at.x,
    y: at.y,
    width: asset.width,
    height: asset.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  }

  return {
    apply(scene) {
      const layer = scene.layers.find((candidate) => candidate.id === layerId)
      if (layer === undefined) {
        throw new EngineError('LAYER_NOT_FOUND')
      }
      if (layer.locked) {
        throw new EngineError('LAYER_LOCKED')
      }
      const collidesWith = findCollisions(layer.objects, object)
      if (collidesWith.length > 0) {
        return { ok: false, collidesWith }
      }
      const layers = scene.layers.map((candidate) =>
        candidate.id === layerId
          ? { ...candidate, objects: [...candidate.objects, object] }
          : candidate
      )
      return { ok: true, scene: { ...scene, layers } }
    },

    undo(scene) {
      const layers = scene.layers.map((layer) => ({
        ...layer,
        objects: layer.objects.filter((candidate) => candidate.id !== object.id),
      }))
      return { ...scene, layers }
    },
  }
}
