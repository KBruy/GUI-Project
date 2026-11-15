export const ENGINE_VERSION = '0.0.0'
export { SCHEMA_VERSION, GRID_SIZE, MAX_LAYERS } from './types'
export type { SceneType, SceneObject, Layer, Scene } from './types'
export {
  createMapScene,
  createCharacterScene,
  createLayer,
  isAllowedMapSize,
  MAP_SIZES,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  CHARACTER_LAYERS,
} from './scene/create'
export type { SceneSize } from './scene/create'
export { EngineError } from './errors'
export type { EngineErrorCode } from './errors'
