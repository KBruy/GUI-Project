export const ENGINE_VERSION = '0.0.0'
export {
  SCHEMA_VERSION,
  GRID_SIZE,
  MAX_LAYERS,
  MIN_SCALE,
  MAX_SCALE,
  MIN_ROTATION,
  MAX_ROTATION,
} from './types'
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
export { findCollisions } from './collision/collisions'
export { canPlace } from './collision/can-place'
export type { Transform, PlaceResult } from './collision/types'
export { addObject } from './commands/add-object'
export { addObjects } from './commands/add-objects'
export { removeObjects } from './commands/remove-object'
export { transformObjects } from './commands/transform-object'
export { moveObjects } from './commands/move-object'
export { combineCommands } from './commands/combine'
export { addLayer } from './commands/add-layer'
export { removeLayer } from './commands/remove-layer'
export { moveLayer } from './commands/move-layer'
export { updateLayer } from './commands/update-layer'
export type { LayerChanges } from './commands/update-layer'
export type { Command, CommandResult, AssetSize } from './commands/types'
export { emptyHistory, execute, undo, redo, canUndo, canRedo } from './history/history'
export type { History, HistoryStep } from './history/history'
export type { Vec2 } from './math/vec2'
export { validateScene } from './validation/validate'
export { MESSAGE_KEYS } from './validation/types'
export type { ValidationCode, ValidationIssue } from './validation/types'
export { snapToGrid, snapCenter } from './snapping/snap'
export { createEditor } from './editor/editor'
export type { Editor, Point, Rect } from './editor/types'
