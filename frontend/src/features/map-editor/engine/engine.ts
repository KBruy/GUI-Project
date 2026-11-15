// Jedyne miejsce, z którego aplikacja bierze silnik. Gdy createEditor będzie gotowy
// w @worldsmith/engine, podmieniamy tu './mockEditor' na '@worldsmith/engine'
// i reszta frontendu się nie zmienia.
export { createEditor, addObject, transformObjects, moveObjects, removeObjects } from './mockEditor'
export type { Editor, Command, PlaceResult, Transform, Point, Rect, AssetSize } from './mockEditor'

export {
  GRID_SIZE,
  MAX_LAYERS,
  SCHEMA_VERSION,
  MAP_SIZES,
  createMapScene,
} from '@worldsmith/engine'
export type { Scene, Layer, SceneObject, SceneType, SceneSize } from '@worldsmith/engine'
