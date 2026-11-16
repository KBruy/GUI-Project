import type { SceneObject } from '../types'
import type { Command } from './types'

/** Usunięty obiekt razem z miejscem, z którego zniknął (do cofnięcia). */
interface Removed {
  layerId: string
  index: number
  object: SceneObject
}

/**
 * Polecenie: usuń obiekty o podanych id (z dowolnych warstw).
 * Nieznane id są pomijane. Cofnięcie wstawia obiekty z powrotem na te same miejsca,
 * więc kolejność rysowania (co jest nad czym) się nie zmienia.
 */
export function removeObjects(ids: readonly string[]): Command {
  // Wypełniane przy apply, czytane przy undo.
  let removed: Removed[] = []

  return {
    apply(scene) {
      removed = []
      for (const layer of scene.layers) {
        layer.objects.forEach((object, index) => {
          if (ids.includes(object.id)) {
            removed.push({ layerId: layer.id, index, object })
          }
        })
      }
      const layers = scene.layers.map((layer) => ({
        ...layer,
        objects: layer.objects.filter((object) => !ids.includes(object.id)),
      }))
      return { ok: true, scene: { ...scene, layers } }
    },

    undo(scene) {
      const layers = scene.layers.map((layer) => {
        const objects = [...layer.objects]
        // Od najmniejszego indeksu, żeby każdy obiekt trafił dokładnie na swoje dawne miejsce.
        for (const entry of removed) {
          if (entry.layerId === layer.id) {
            objects.splice(entry.index, 0, entry.object)
          }
        }
        return { ...layer, objects }
      })
      return { ...scene, layers }
    },
  }
}
