/**
 * Kody błędów silnika. LAYER_LIMIT i INVALID_SCENE_SIZE mają te same kody co backend,
 * więc frontend ma już do nich tłumaczenia (errors.layerLimit, errors.invalidSceneSize).
 */
export type EngineErrorCode = 'LAYER_LIMIT' | 'LAYER_NOT_FOUND' | 'INVALID_SCENE_SIZE'

/** Błąd rzucany przez silnik. Frontend łapie go i pokazuje komunikat po kodzie. */
export class EngineError extends Error {
  readonly code: EngineErrorCode

  constructor(code: EngineErrorCode) {
    super(code)
    this.name = 'EngineError'
    this.code = code
  }
}
