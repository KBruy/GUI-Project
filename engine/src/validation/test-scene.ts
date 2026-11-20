import { layer, sceneWith, square } from '../commands/test-scene'
import type { Scene } from '../types'

// Pomocnicze dane tylko dla testów walidacji.

/** Poprawna mapa 640 × 480: dwie warstwy, dwa kwadraty daleko od siebie. */
export const validScene: Scene = sceneWith([
  layer('grass', [square('a', 100, 100)]),
  layer('trees', [square('tree', 300, 300)]),
])

export { layer, sceneWith, square }
