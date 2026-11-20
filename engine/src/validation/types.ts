/**
 * Kody problemów sceny (rozdz. 5.5). Te same kody i klucze tłumaczeń ma backend
 * (backend/src/errors.py), więc frontend pokazuje problemy z silnika i z backendu tak samo.
 * Bez kodów assetów (ASSET_*): sprawdza je backend, który zna bibliotekę assetów.
 */
export const MESSAGE_KEYS = {
  UNSUPPORTED_SCHEMA_VERSION: 'errors.unsupportedSchemaVersion',
  NAME_REQUIRED: 'errors.nameRequired',
  INVALID_SCENE_SIZE: 'errors.invalidSceneSize',
  LAYER_LIMIT: 'errors.layerLimit',
  DUPLICATE_ID: 'errors.duplicateId',
  SCALE_OUT_OF_RANGE: 'errors.scaleOutOfRange',
  ROTATION_OUT_OF_RANGE: 'errors.rotationOutOfRange',
  OBJECT_OUT_OF_BOUNDS: 'errors.objectOutOfBounds',
  COLLISION: 'errors.collision',
} as const

/** Kod problemu: jeden z kluczy MESSAGE_KEYS. */
export type ValidationCode = keyof typeof MESSAGE_KEYS

/** Jeden problem sceny; ten sam kształt co Issue w backendzie. */
export interface ValidationIssue {
  code: ValidationCode
  messageKey: string
  /** Warstwa, której dotyczy problem (brak przy problemach całej sceny). */
  layerId?: string
  /** Obiekt, którego dotyczy problem. */
  objectId?: string
}

/** Tworzy problem o danym kodzie z kluczem tłumaczenia z MESSAGE_KEYS. */
export function issue(
  code: ValidationCode,
  where: { layerId?: string; objectId?: string } = {}
): ValidationIssue {
  return { code, messageKey: MESSAGE_KEYS[code], ...where }
}
