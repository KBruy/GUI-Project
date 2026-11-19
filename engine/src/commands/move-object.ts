import { findCollisions } from '../collision/collisions'
import { EngineError } from '../errors'
import type { Vec2 } from '../math/vec2'
import type { Command } from './types'

/**
 * Polecenie: przesuń podane obiekty o ten sam wektor.
 * Jedno polecenie, więc „cofnij” cofa przesunięcie całej grupy naraz.
 * Przy kolizji z obiektem, który się nie rusza, zwraca { ok: false, collidesWith }.
 * Obiekty z ids nie kolidują między sobą.
 * Rzuca EngineError('LAYER_LOCKED'), gdy któryś obiekt leży na zablokowanej warstwie.
 */
export function moveObjects(ids: readonly string[], delta: Vec2): Command {
  let before = new Map<string, Vec2>()

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
          before.set(object.id, { x: object.x, y: object.y })
          return { ...object, x: object.x + delta.x, y: object.y + delta.y }
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
