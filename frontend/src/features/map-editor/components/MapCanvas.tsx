// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect, useMemo, type DragEvent } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { SelectionLayer } from '@/shared/canvas/SelectionLayer'
import { toast } from '@/shared/components/ui/Toast/toast'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { assetUrl } from '@/shared/lib/assets'
import type { Point, Scene } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'
import { useSelectionControls } from '../useSelectionControls'
import { useViewControls } from '../useViewControls'
import { toScenePoint } from '../view'
import { ASSET_DRAG_TYPE } from './AssetPalette'
import styles from './MapCanvas.module.css'

// Odsunięcie etykiety ze współrzędnymi od kursora, żeby go nie zasłaniała.
const LABEL_OFFSET = 16

// Kopia sceny z obiektami ids przesuniętymi o wektor (tylko do podglądu przeciągania).
function moveInScene(scene: Scene, ids: string[], delta: Point): Scene {
  return {
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      objects: layer.objects.map((o) =>
        ids.includes(o.id) ? { ...o, x: o.x + delta.x, y: o.y + delta.y } : o
      ),
    })),
  }
}

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const zoom = useEditorStore((s) => s.zoom)
  const offset = useEditorStore((s) => s.offset)
  const setViewport = useEditorStore((s) => s.setViewport)
  const assets = useEditorStore((s) => s.assets)
  const addAsset = useEditorStore((s) => s.addAsset)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  // assetId → adres PNG. Obiekt, którego assetu nie ma w bibliotece, rysuje się jako czerwony prostokąt.
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, assetUrl(a.file)])), [assets])
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const view = useViewControls(ref)
  const selection = useSelectionControls(ref)
  const { drag } = selection
  useEditorShortcuts()

  // Podczas przeciągania rysujemy zaznaczone obiekty w nowym miejscu.
  // Scena w store (i w silniku) zmienia się dopiero po upuszczeniu.
  const shownScene = useMemo(
    () => (scene && drag ? moveInScene(scene, selectedIds, drag.delta) : scene),
    [scene, selectedIds, drag]
  )
  // Ramki: zaznaczone obiekty i te, z którymi przeciągane by kolidowały. Ukryte warstwy pomijamy.
  const { selected, collisions } = useMemo(() => {
    const objects = (shownScene?.layers ?? [])
      .filter((layer) => layer.visible)
      .flatMap((layer) => layer.objects)
    return {
      selected: objects.filter((o) => selectedIds.includes(o.id)),
      collisions: objects.filter((o) => drag?.collidesWith.includes(o.id)),
    }
  }, [shownScene, selectedIds, drag])
  // Etykieta przy kursorze: środek chwyconego obiektu, tak jak x, y w panelu właściwości.
  const anchor = drag && selected.find((o) => o.id === drag.anchorId)

  // Store potrzebuje rozmiaru canvasu do zoomu w środku i „Dopasuj do ekranu”.
  useEffect(() => {
    if (width > 0 && height > 0) setViewport({ width, height })
  }, [width, height, setViewport])

  // Bez preventDefault przeglądarka nie pozwoli upuścić kafelka z palety.
  function onDragOver(e: DragEvent) {
    if (scene && e.dataTransfer.types.includes(ASSET_DRAG_TYPE)) e.preventDefault()
  }

  // Obiekt staje tam, gdzie puszczono kursor (środek obiektu pod kursorem, potem przyciąganie).
  function onDrop(e: DragEvent) {
    const asset = assets.find((a) => a.id === e.dataTransfer.getData(ASSET_DRAG_TYPE))
    if (!asset || !ref.current) return
    e.preventDefault()
    const rect = ref.current.getBoundingClientRect()
    const point = toScenePoint(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { zoom, offset }
    )
    if (!addAsset(asset, point).ok) toast.error('errors.collision')
  }

  return (
    <div
      ref={ref}
      className={styles.canvas}
      style={{ cursor: view.cursor ?? (drag ? 'move' : undefined) }}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
      {drag && anchor && (
        <div
          className={styles.coords}
          style={{ left: drag.pointer.x + LABEL_OFFSET, top: drag.pointer.y + LABEL_OFFSET }}
        >
          {anchor.x}, {anchor.y}
        </div>
      )}
    </div>
  )
}
