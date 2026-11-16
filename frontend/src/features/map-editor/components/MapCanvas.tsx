// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect, useMemo } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { SelectionLayer } from '@/shared/canvas/SelectionLayer'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { assetUrl } from '@/shared/lib/assets'
import type { Point, Scene, SceneObject } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'
import { usePalettePlacing } from '../usePalettePlacing'
import { useSelectionControls } from '../useSelectionControls'
import { useViewControls } from '../useViewControls'
import styles from './MapCanvas.module.css'

// Odsunięcie etykiety ze współrzędnymi od kursora, żeby go nie zasłaniała.
const LABEL_OFFSET = 16

// Scena do pokazania podczas przeciągania: obiekty ids przesunięte o wektor, a podgląd assetu
// z palety (ghost) dopisany na aktywną warstwę. Scena w store zmienia się dopiero po upuszczeniu.
function previewScene(
  scene: Scene,
  ids: string[],
  delta: Point | null,
  ghost: SceneObject | null,
  layerId: string | null
): Scene {
  return {
    ...scene,
    layers: scene.layers.map((layer) => {
      const objects = delta
        ? layer.objects.map((o) =>
            ids.includes(o.id) ? { ...o, x: o.x + delta.x, y: o.y + delta.y } : o
          )
        : layer.objects
      return { ...layer, objects: ghost && layer.id === layerId ? [...objects, ghost] : objects }
    }),
  }
}

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const zoom = useEditorStore((s) => s.zoom)
  const offset = useEditorStore((s) => s.offset)
  const setViewport = useEditorStore((s) => s.setViewport)
  const assets = useEditorStore((s) => s.assets)
  const activeLayerId = useEditorStore((s) => s.activeLayerId)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  // assetId → adres PNG. Obiekt, którego assetu nie ma w bibliotece, rysuje się jako czerwony prostokąt.
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, assetUrl(a.file)])), [assets])
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const view = useViewControls(ref)
  const selection = useSelectionControls(ref)
  const { drag } = selection
  const ghost = usePalettePlacing(ref)
  useEditorShortcuts()

  // Podczas przeciągania rysujemy obiekty w nowym miejscu (albo podgląd assetu z palety).
  const shownScene = useMemo(
    () =>
      scene && (drag || ghost)
        ? previewScene(
            scene,
            selectedIds,
            drag?.delta ?? null,
            ghost?.object ?? null,
            activeLayerId
          )
        : scene,
    [scene, selectedIds, drag, ghost, activeLayerId]
  )
  // Ramki: zaznaczone obiekty (albo podgląd z palety) i te, z którymi by kolidowały.
  // Ukryte warstwy pomijamy.
  const { selected, collisions } = useMemo(() => {
    const objects = (shownScene?.layers ?? [])
      .filter((layer) => layer.visible)
      .flatMap((layer) => layer.objects)
    const collidesWith = drag?.collidesWith ?? ghost?.collidesWith ?? []
    return {
      selected: ghost
        ? objects.filter((o) => o.id === ghost.object.id)
        : objects.filter((o) => selectedIds.includes(o.id)),
      collisions: objects.filter((o) => collidesWith.includes(o.id)),
    }
  }, [shownScene, selectedIds, drag, ghost])
  // Etykieta przy kursorze: środek chwyconego obiektu (albo podglądu), tak jak x, y w panelu właściwości.
  const anchor = drag ? selected.find((o) => o.id === drag.anchorId) : ghost?.object
  const pointer = drag?.pointer ?? ghost?.pointer

  // Store potrzebuje rozmiaru canvasu do zoomu w środku i „Dopasuj do ekranu”.
  useEffect(() => {
    if (width > 0 && height > 0) setViewport({ width, height })
  }, [width, height, setViewport])

  return (
    <div
      ref={ref}
      className={styles.canvas}
      style={{ cursor: view.cursor ?? (drag ? 'move' : undefined) }}
      // Najpierw widok: gdy zacznie przesuwanie, zaznaczanie to pomija (defaultPrevented).
      onPointerDown={(e) => {
        view.handlers.onPointerDown(e)
        selection.handlers.onPointerDown(e)
      }}
      onPointerMove={(e) => {
        view.handlers.onPointerMove(e)
        selection.handlers.onPointerMove(e)
      }}
      onPointerUp={() => {
        view.handlers.onPointerUp()
        selection.handlers.onPointerUp()
      }}
      onPointerCancel={() => {
        view.handlers.onPointerCancel()
        selection.handlers.onPointerCancel()
      }}
    >
      {/* Przed pierwszym pomiarem rozmiar to 0, a Konva nie przyjmuje pustego canvasu. */}
      {shownScene && width > 0 && height > 0 && (
        <SceneRenderer
          scene={shownScene}
          width={width}
          height={height}
          zoom={zoom}
          offset={offset}
          getAssetUrl={(id) => urls.get(id)}
        >
          {gridVisible && (
            <GridLayer
              width={shownScene.width}
              height={shownScene.height}
              size={shownScene.gridSize}
            />
          )}
          <SelectionLayer
            objects={selected}
            collisions={collisions}
            marquee={selection.marquee}
            shakeKey={selection.shakeKey}
          />
        </SceneRenderer>
      )}
      {anchor && pointer && (
        <div
          className={styles.coords}
          style={{ left: pointer.x + LABEL_OFFSET, top: pointer.y + LABEL_OFFSET }}
        >
          {anchor.x}, {anchor.y}
        </div>
      )}
    </div>
  )
}
