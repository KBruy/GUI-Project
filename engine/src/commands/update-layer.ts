import { EngineError } from '../errors'
import type { Layer } from '../types'
import type { Command } from './types'

/** Pola warstwy, które użytkownik zmienia w panelu warstw. */
export type LayerChanges = Partial<Pick<Layer, 'name' | 'visible' | 'locked'>>

/**
 * Polecenie: zmień nazwę, widoczność albo blokadę warstwy, np. { visible: false }.
 * Działa też na zablokowanej warstwie (inaczej nie dałoby się jej odblokować).
 * Cofnięcie przywraca poprzednie wartości.
 * Rzuca EngineError('LAYER_NOT_FOUND'), gdy warstwy nie ma.
 */
export function updateLayer(layerId: string, changes: LayerChanges): Command {
  // Wartości sprzed apply.
  let before: LayerChanges = {}

  return {
    apply(scene) {
      const layer = scene.layers.find((candidate) => candidate.id === layerId)
      if (layer === undefined) {
        throw new EngineError('LAYER_NOT_FOUND')
      }
      before = { name: layer.name, visible: layer.visible, locked: layer.locked }
      const layers = scene.layers.map((candidate) =>
        candidate.id === layerId ? { ...candidate, ...changes } : candidate
      )
      return { ok: true, scene: { ...scene, layers } }
    },

    undo(scene) {
      const layers = scene.layers.map((candidate) =>
        candidate.id === layerId ? { ...candidate, ...before } : candidate
      )
      return { ...scene, layers }
    },
  }
}
