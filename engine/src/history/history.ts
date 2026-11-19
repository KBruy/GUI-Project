import type { Command, CommandResult } from '../commands/types'
import type { Scene } from '../types'

/**
 * Historia zmian: dwa stosy poleceń.
 * past to wykonane polecenia, future to cofnięte, które można ponowić.
 * Jedno polecenie to jeden krok cofania.
 */
export interface History {
  readonly past: readonly Command[]
  readonly future: readonly Command[]
}

/** Historia nowej albo właśnie wczytanej sceny: nie ma czego cofać ani ponawiać. */
export const emptyHistory: History = { past: [], future: [] }

/** Stan po cofnięciu albo ponowieniu: nowa historia i nowa scena. */
export interface HistoryStep {
  history: History
  scene: Scene
}

/**
 * Wykonuje polecenie. Udane trafia na koniec past, a future się czyści
 * (po nowej zmianie nie da się ponowić starych cofnięć).
 * Przy kolizji historia się nie zmienia: nieudana próba nie jest krokiem do cofnięcia.
 */
export function execute(
  history: History,
  scene: Scene,
  command: Command
): { history: History; result: CommandResult } {
  const result = command.apply(scene)
  if (!result.ok) {
    return { history, result }
  }
  return { history: { past: [...history.past, command], future: [] }, result }
}

/** Cofa ostatnie polecenie. Przy pustej historii zwraca wszystko bez zmian. */
export function undo(history: History, scene: Scene): HistoryStep {
  const command = history.past.at(-1)
  if (command === undefined) {
    return { history, scene }
  }
  return {
    history: { past: history.past.slice(0, -1), future: [...history.future, command] },
    scene: command.undo(scene),
  }
}

/** Ponawia ostatnio cofnięte polecenie. Gdy nie ma czego ponowić, zwraca wszystko bez zmian. */
export function redo(history: History, scene: Scene): HistoryStep {
  const command = history.future.at(-1)
  if (command === undefined) {
    return { history, scene }
  }
  const result = command.apply(scene)
  // Ponowienie na scenie, na której polecenie już raz się udało, nie powinno kolidować.
  // Gdyby jednak kolidowało, zostawiamy wszystko bez zmian zamiast psuć scenę.
  if (!result.ok) {
    return { history, scene }
  }
  return {
    history: { past: [...history.past, command], future: history.future.slice(0, -1) },
    scene: result.scene,
  }
}

/** Czy przycisk „Cofnij” ma być aktywny. */
export function canUndo(history: History): boolean {
  return history.past.length > 0
}

/** Czy przycisk „Ponów” ma być aktywny. */
export function canRedo(history: History): boolean {
  return history.future.length > 0
}
