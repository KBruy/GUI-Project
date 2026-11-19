import type { Command } from './types'

/**
 * Łączy kilka poleceń w jedno, więc jedno „cofnij” cofa je wszystkie naraz
 * (np. 20 kafelków namalowanych jednym pociągnięciem pędzla).
 * apply wykonuje polecenia po kolei, każde na scenie po poprzednim.
 * Wszystko albo nic: gdy któreś zwróci kolizję, całe polecenie zwraca tę kolizję
 * i scena się nie zmienia.
 * undo cofa polecenia w odwrotnej kolejności.
 */
export function combineCommands(commands: readonly Command[]): Command {
  return {
    apply(scene) {
      let current = scene
      for (const command of commands) {
        const result = command.apply(current)
        if (!result.ok) {
          return result
        }
        current = result.scene
      }
      return { ok: true, scene: current }
    },

    undo(scene) {
      let current = scene

      for (const command of [...commands].reverse()) {
        current = command.undo(current)
      }
      return current
    },
  }
}
