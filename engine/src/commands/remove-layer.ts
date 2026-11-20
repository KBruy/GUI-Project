import { EngineError } from '../errors'
import type { Layer } from '../types'
import type { Command } from './types'

/**
 * Polecenie: usuń warstwę razem z jej obiektami.
 * Cofnięcie wstawia ją z powrotem na to samo miejsce, z tymi samymi obiektami.
 * Rzuca EngineError('LAYER_NOT_FOUND'), gdy warstwy nie ma,
 * EngineError('LAYER_LOCKED'), gdy jest zablokowana,
 * i EngineError('LAST_LAYER'), gdy to ostatnia warstwa (edytor musi mieć gdzie stawiać obiekty).
 */
export function removeLayer(layerId: string): Command {
  // Wypełniane przy apply, czytane przy undo.
  let removed: { index: number; layer: Layer } | null = null

  return {
    apply(scene) {
      const index = scene.layers.findIndex((candidate) => candidate.id === layerId)
      if (index === -1) {
        throw new EngineError('LAYER_NOT_FOUND')
      }
      if (scene.layers[index].locked) {
        throw new EngineError('LAYER_LOCKED')
      }
      if (scene.layers.length === 1) {
        throw new EngineError('LAST_LAYER')
      }
      removed = { index, layer: scene.layers[index] }
      return { ok: true, scene: { ...scene, layers: scene.layers.filter((_, i) => i !== index) } }
    },

    undo(scene) {
      if (removed === null) {
        return scene
      }
      const layers = [...scene.layers]
      layers.splice(removed.index, 0, removed.layer)
      return { ...scene, layers }
    },
  }
}
