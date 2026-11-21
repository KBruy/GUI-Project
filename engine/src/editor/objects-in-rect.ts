import { getCorners } from '../geometry/corners'
import { pointInShape } from '../geometry/point'
import { satOverlap } from '../geometry/sat'
import type { Scene } from '../types'
import type { Rect } from './types'
import { aabbOverlap, getAABB } from '../geometry/aabb'

/**
 * Id obiektów, które nachodzą na prostokąt, od najniższego do najwyższego
 * (kolejność warstw, a w warstwie kolejność obiektów).
 * Pomija warstwy ukryte i zablokowane: takich obiektów nie da się zaznaczyć.
 */
export function objectsInRect(scene: Scene, rect: Rect): string[] {
  const selectable = scene.layers
    .filter((layer) => layer.visible && !layer.locked)
    .flatMap((layer) => layer.objects)

  // Prostokąt o zerowym rozmiarze to kliknięcie: liczy się, czy punkt leży w obiekcie.
  if (rect.width === 0 && rect.height === 0) {
    const point = { x: rect.x, y: rect.y }
    const hit = selectable.filter((object) => pointInShape(point, object))
    return hit.map((object) => object.id)
  }

  // Ramkę zamieniamy na kształt jak obiekt sceny (środek, bez obrotu), żeby użyć SAT.
  const area = getCorners({
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
    width: rect.width,
    height: rect.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  })
  const box = getAABB(area)
  // Najpierw AABB jak w kolizjach: ramka o zerowej szerokości lub wysokości nie ma
  // w SAT jednej osi, więc sam SAT zaznaczyłby obrócony obiekt obok niej.
  const hit = selectable.filter((object) => {
    const corners = getCorners(object)
    return aabbOverlap(box, getAABB(corners)) && satOverlap(area, corners)
  })
  return hit.map((object) => object.id)
}
