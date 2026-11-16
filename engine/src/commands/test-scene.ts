import type { Layer, Scene, SceneObject } from '../types'

// Pomocnicze dane tylko dla testów poleceń.

/** Kwadrat 20 × 20 o podanym id i środku. */
export const square = (id: string, x: number, y: number): SceneObject => ({
  id,
  assetId: 'test_square',
  x,
  y,
  width: 20,
  height: 20,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
})

export const layer = (id: string, objects: SceneObject[]): Layer => ({
  id,
  name: id,
  visible: true,
  locked: false,
  objects,
})

/** Scena 640 × 480 z podanymi warstwami. */
export const sceneWith = (layers: Layer[]): Scene => ({
  schemaVersion: 1,
  id: 'scene_test',
  type: 'map',
  name: 'Test',
  width: 640,
  height: 480,
  gridSize: 32,
  background: { color: '#7ec850' },
  layers,
  createdAt: '2026-11-14T12:00:00Z',
  updatedAt: '2026-11-14T12:00:00Z',
})
