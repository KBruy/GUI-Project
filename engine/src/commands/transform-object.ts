import { findCollisions } from '../collision/collisions'
import type { Transform } from '../collision/types'
import type { SceneObject } from '../types'
import type { Command } from './types'
import { EngineError } from '../errors'

/** Wyciąga z obiektu tylko pola przekształcenia. */
function transformOf(object: SceneObject): Transform {
  const { x, y, rotation, scaleX, scaleY } = object
  return { x, y, rotation, scaleX, scaleY }
}

/**
 * Polecenie: ustaw te same wartości wszystkim podanym obiektom,
 * np. { x: 320, y: 128 } albo { rotation: 90 } (rozdz. 6.3).
 * Przy kolizji z obiektem, który się nie rusza, zwraca { ok: false, collidesWith }.
 * Obiekty z ids nie kolidują między sobą. Cofnięcie przywraca każdemu jego dawne wartości.
 */
export function transformObjects(ids: readonly string[], transform: Partial<Transform>): Command {
  // Wartości sprzed apply, zapisane dla każdego obiektu osobno.
  let before = new Map<string, Transform>()

  return {
    apply(scene) {
      before = new Map()
      const collidesWith = new Set<string>()

      const layers = scene.layers.map((layer) => {
        const objects = layer.objects.map((object) => {
          if (!ids.includes(object.id)) {
            return object
          }
          if (layer.locked) {
            throw new EngineError('LAYER_LOCKED')
          }
          before.set(object.id, transformOf(object))
          return { ...object, ...transform }
        })
        for (const moved of objects.filter((object) => ids.includes(object.id))) {
          findCollisions(objects, moved, ids).forEach((id) => collidesWith.add(id))
        }
        return { ...layer, objects }
      })

      if (collidesWith.size > 0) {
        return { ok: false, collidesWith: [...collidesWith] }
      }
      return { ok: true, scene: { ...scene, layers } }
    },

    undo(scene) {
      const layers = scene.layers.map((layer) => ({
        ...layer,
        objects: layer.objects.map((object) => {
          const previous = before.get(object.id)
          return previous === undefined ? object : { ...object, ...previous }
        }),
      }))
      return { ...scene, layers }
    },
  }
}
