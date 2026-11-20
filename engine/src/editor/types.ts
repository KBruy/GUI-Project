import type { PlaceResult, Transform } from '../collision/types'
import type { Command } from '../commands/types'
import type { Vec2 } from '../math/vec2'
import type { Scene } from '../types'

/** Punkt na scenie. To samo co Vec2, ale pod nazwą, której używa frontend. */
export type Point = Vec2

/** Prostokąt liczony od lewego górnego rogu, np. ramka zaznaczania myszą. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Edytor jednej sceny (rozdz. 6.3): trzyma bieżącą scenę i historię cofania.
 * Frontend zmienia scenę tylko przez execute, undo i redo.
 */
export interface Editor {
  getScene(): Scene
  /** Słuchacz dostaje nową scenę po każdej zmianie. Zwraca funkcję, która go wypisuje. */
  subscribe(listener: (scene: Scene) => void): () => void
  /** Wykonuje polecenie i zapisuje je w historii. Przy kolizji niczego nie zmienia. */
  execute(command: Command): PlaceResult
  /** Wynik polecenia bez zmiany sceny i historii (podgląd przy przeciąganiu). */
  /** Podawaj nowe polecenie: apply nadpisuje to, co polecenie pamięta do cofania. */
  canExecute(command: Command): PlaceResult
  canPlace(objectId: string, transform: Partial<Transform>): PlaceResult
  undo(): void
  redo(): void
  /** Przyciąga punkt do najbliższego węzła siatki sceny. */
  snapToGrid(point: Point): Point
  /** Id obiektów w prostokącie, od najniższego do najwyższego. */
  objectsInRect(rect: Rect): string[]
}
