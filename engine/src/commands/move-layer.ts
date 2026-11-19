import { EngineError } from '../errors'
import type { Scene } from '../types'
import type { Command } from './types'

/** Kopia sceny z warstwą przeniesioną z pozycji from na pozycję to. */
function withLayerMoved(scene: Scene, from: number, to: number): Scene {
  const layers = [...scene.layers]
  const [layer] = layers.splice(from, 1)
  layers.splice(to, 0, layer)
  return { ...scene, layers }
}

/**
 * Polecenie: przenieś warstwę na podaną pozycję (0 = najniżej, rysowana jako pierwsza).
 * Pozycja spoza listy jest przycinana do pierwszej albo ostatniej.
 * Zablokowana warstwa stoi w miejscu: nie można jej przenieść ani przenieść innej warstwy
 * przez nią (np. spodni pod ciało postaci).
 * Rzuca EngineError('LAYER_NOT_FOUND'), gdy warstwy nie ma,
 * i EngineError('LAYER_LOCKED'), gdy ruch przesunąłby zablokowaną warstwę.
 */
export function moveLayer(layerId: string, toIndex: number): Command {
  // Pozycje zapamiętane przy apply, żeby cofnąć dokładnie ten ruch.
  let from = -1
  let to = -1

  return {
    apply(scene) {
      from = scene.layers.findIndex((candidate) => candidate.id === layerId)
      if (from === -1) {
        throw new EngineError('LAYER_NOT_FOUND')
      }
      to = Math.min(Math.max(toIndex, 0), scene.layers.length - 1)
      // Warstwy od from do to zmieniają pozycję, więc żadna z nich nie może być zablokowana.
      const affected = scene.layers.slice(Math.min(from, to), Math.max(from, to) + 1)
      if (affected.some((layer) => layer.locked)) {
        throw new EngineError('LAYER_LOCKED')
      }
      return { ok: true, scene: withLayerMoved(scene, from, to) }
    },

    undo(scene) {
      return from === -1 ? scene : withLayerMoved(scene, to, from)
    },
  }
}
