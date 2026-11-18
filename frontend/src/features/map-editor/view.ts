// Obliczenia widoku edytora (F-28): zoom i przesunięcie.
// Czyste funkcje bez Reacta i Konvy, więc łatwo je testować.
// Widok to { zoom, offset }: punkt sceny (x, y) jest na ekranie w (offset.x + x * zoom, offset.y + y * zoom).
import type { Point } from './engine/engine'

export interface Size {
  width: number
  height: number
}

export interface View {
  zoom: number
  offset: Point
}

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4
// Ile pikseli mapy musi zostać na ekranie, żeby widoku nie dało się „zgubić”.
const VISIBLE_MARGIN = 64
// Odstęp od krawędzi przy „Dopasuj do ekranu”.
const FIT_PADDING = 32

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

// Pilnuje, żeby przynajmniej VISIBLE_MARGIN px mapy było widać w poziomie i w pionie.
export function clampOffset(offset: Point, zoom: number, scene: Size, viewport: Size): Point {
  const clamp = (value: number, sceneLength: number, viewportLength: number) =>
    Math.min(viewportLength - VISIBLE_MARGIN, Math.max(VISIBLE_MARGIN - sceneLength * zoom, value))
  return {
    x: clamp(offset.x, scene.width, viewport.width),
    y: clamp(offset.y, scene.height, viewport.height),
  }
}

// Zmienia zoom tak, żeby punkt sceny pod `anchor` (punkt na ekranie, np. kursor) został w miejscu.
export function zoomAt(view: View, anchor: Point, zoom: number): View {
  const next = clampZoom(zoom)
  const sceneX = (anchor.x - view.offset.x) / view.zoom
  const sceneY = (anchor.y - view.offset.y) / view.zoom
  return { zoom: next, offset: { x: anchor.x - sceneX * next, y: anchor.y - sceneY * next } }
}

// Największy zoom, przy którym cała mapa mieści się na ekranie, z mapą na środku.
export function fitView(scene: Size, viewport: Size): View {
  const zoom = clampZoom(
    Math.min(
      (viewport.width - 2 * FIT_PADDING) / scene.width,
      (viewport.height - 2 * FIT_PADDING) / scene.height
    )
  )
  return {
    zoom,
    offset: {
      x: (viewport.width - scene.width * zoom) / 2,
      y: (viewport.height - scene.height * zoom) / 2,
    },
  }
}
