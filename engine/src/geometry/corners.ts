import { rotatePoint } from '../math/rotate'
import type { Vec2 } from '../math/vec2'
import type { SceneObject } from '../types'

/** Pola obiektu potrzebne do policzenia jego kształtu na scenie. */
export type Shape = Pick<
  SceneObject,
  'x' | 'y' | 'width' | 'height' | 'rotation' | 'scaleX' | 'scaleY'
>

/** Cztery narożniki prostokąta. */
export type Corners = [Vec2, Vec2, Vec2, Vec2]

/**
 * Zwraca narożniki obróconego obiektu w kolejności:
 * lewy górny, prawy górny, prawy dolny, lewy dolny (przed obrotem).
 */
export function getCorners(shape: Shape): Corners {
  const center = { x: shape.x, y: shape.y }
  // Połowa szerokości i wysokości po skalowaniu.
  const hw = (shape.width * shape.scaleX) / 2
  const hh = (shape.height * shape.scaleY) / 2

  const unrotated: Corners = [
    { x: shape.x - hw, y: shape.y - hh },
    { x: shape.x + hw, y: shape.y - hh },
    { x: shape.x + hw, y: shape.y + hh },
    { x: shape.x - hw, y: shape.y + hh },
  ]

  return [
    rotatePoint(unrotated[0], center, shape.rotation),
    rotatePoint(unrotated[1], center, shape.rotation),
    rotatePoint(unrotated[2], center, shape.rotation),
    rotatePoint(unrotated[3], center, shape.rotation),
  ]
}
