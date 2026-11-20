import type { Scene } from '../types'

/**
 * Wynik wykonania polecenia: nowa scena albo lista kolizji.
 * Przy kolizji scena się nie zmienia, a polecenie nie trafia do historii.
 */
export type CommandResult = { ok: true; scene: Scene } | { ok: false; collidesWith: string[] }

/**
 * Polecenie zmiany sceny (rozdz. 6.1): apply wykonuje zmianę, undo ją cofa.
 * Obie metody zwracają nową scenę i nie zmieniają tej, którą dostały.
 * undo dostaje scenę po apply i zwraca scenę sprzed apply.
 */
export interface Command {
  apply(scene: Scene): CommandResult
  undo(scene: Scene): Scene
}

/** Tyle z assetu potrzebuje silnik, żeby postawić obiekt (jak w zaślepce frontendu). */
export interface AssetSize {
  id: string
  width: number
  height: number
}
