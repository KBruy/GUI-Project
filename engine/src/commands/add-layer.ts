import { EngineError } from '../errors'
import { createLayer } from '../scene/create'
import { MAX_LAYERS } from '../types'
import type { Command } from './types'

/**
 * Polecenie: dodaj pustą warstwę na wierzchu (koniec listy warstw).
 * Rzuca EngineError('LAYER_LIMIT'), gdy scena ma już MAX_LAYERS warstw.
 */
export function addLayer(name: string): Command {
  // Warstwa powstaje raz, przy tworzeniu polecenia, więc ponów dodaje tę samą (to samo id).
  const layer = createLayer(name)

  return {
    apply(scene) {
      if (scene.layers.length >= MAX_LAYERS) {
        throw new EngineError('LAYER_LIMIT')
      }
      return { ok: true, scene: { ...scene, layers: [...scene.layers, layer] } }
    },

    undo(scene) {
      return { ...scene, layers: scene.layers.filter((candidate) => candidate.id !== layer.id) }
    },
  }
}
