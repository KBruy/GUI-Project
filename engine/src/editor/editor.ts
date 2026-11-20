import { canPlace as checkPlace } from '../collision/can-place'
import type { PlaceResult } from '../collision/types'
import type { CommandResult } from '../commands/types'
import {
  emptyHistory,
  execute as executeCommand,
  redo as redoCommand,
  undo as undoCommand,
  canRedo as hasRedo,
  canUndo as hasUndo,
} from '../history/history'
import { snapToGrid as snapPoint } from '../snapping/snap'
import type { Scene } from '../types'
import { objectsInRect as findInRect } from './objects-in-rect'
import type { Editor } from './types'

/** Frontend nie potrzebuje sceny z wyniku polecenia, dostaje ją przez subscribe. */
function toPlaceResult(result: CommandResult): PlaceResult {
  return result.ok ? { ok: true } : { ok: false, collidesWith: result.collidesWith }
}

/**
 * Tworzy edytor sceny (rozdz. 6.3). Scena i historia żyją w domknięciu,
 * a słuchacze (store frontendu) dostają nową scenę po każdej zmianie.
 * EngineError z polecenia (np. LAYER_LOCKED) leci dalej do wywołującego,
 * a scena i historia zostają wtedy bez zmian.
 */
export function createEditor(initialScene: Scene): Editor {
  let scene = initialScene
  let history = emptyHistory
  const listeners = new Set<(scene: Scene) => void>()

  function setScene(next: Scene) {
    scene = next
    listeners.forEach((listener) => listener(scene))
  }

  return {
    getScene: () => scene,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    execute(command) {
      const step = executeCommand(history, scene, command)
      history = step.history
      if (step.result.ok) {
        setScene(step.result.scene)
      }
      return toPlaceResult(step.result)
    },

    // Samo apply, bez historii: scena jest niemutowalna, więc nic się nie zmienia.
    canExecute: (command) => toPlaceResult(command.apply(scene)),

    canPlace: (objectId, transform) => checkPlace(scene, objectId, transform),

    undo() {
      const step = undoCommand(history, scene)
      // Pusta historia: nic się nie zmieniło, więc nie powiadamiamy słuchaczy.
      if (step.history === history) {
        return
      }
      history = step.history
      setScene(step.scene)
    },

    redo() {
      const step = redoCommand(history, scene)
      if (step.history === history) {
        return
      }
      history = step.history
      setScene(step.scene)
    },

    canUndo: () => hasUndo(history),

    canRedo: () => hasRedo(history),

    snapToGrid: (point) => snapPoint(point, scene.gridSize),

    objectsInRect: (rect) => findInRect(scene, rect),
  }
}
