// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect, useMemo, type PointerEvent } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { SelectionLayer } from '@/shared/canvas/SelectionLayer'
import { SelectionTransformer } from '@/shared/canvas/SelectionTransformer'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { assetUrl } from '@/shared/lib/assets'
import type { Point, Scene, SceneObject } from '../engine/engine'
import { groupBox, MAX_SCALE, MIN_SCALE, useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'
import { useEraser } from '../useEraser'
import { usePalettePlacing } from '../usePalettePlacing'
import { useSelectionControls } from '../useSelectionControls'
import { useTransformControls } from '../useTransformControls'
import { useViewControls } from '../useViewControls'
import { toScenePoint } from '../view'
import styles from './MapCanvas.module.css'

// Odsunięcie etykiety ze współrzędnymi od kursora, żeby go nie zasłaniała.
const LABEL_OFFSET = 16
// Po ruchu strzałkami kursora nie ma, więc etykieta przylega prawie do rogu obiektu (tuż za ramką).
const NUDGE_LABEL_OFFSET = 4
// Granice skali przy uchwytach, te same co przy zapisie (backend).
const SCALE_LIMITS = { min: MIN_SCALE, max: MAX_SCALE }
// Miejsce na etykietę, z zapasem na najdłuższe „2048, 1536”.
const LABEL_SPACE = { x: 112, y: 40 }

// Scena do pokazania podczas przeciągania: obiekty ids przesunięte o wektor, a podgląd assetu
// z palety i obiekty malowane pędzlem (extra) dopisane na aktywną warstwę. Scena w store zmienia się
// dopiero po upuszczeniu albo puszczeniu przycisku. Obiekty starte gumką (hidden) są pominięte.
function previewScene(
  scene: Scene,
  ids: string[],
  delta: Point | null,
  extra: SceneObject[],
  layerId: string | null,
  transformed: SceneObject | null,
  hidden: string[]
): Scene {
  return {
    ...scene,
    layers: scene.layers.map((layer) => {
      const shown = layer.objects.filter((o) => !hidden.includes(o.id))
      const objects = shown.map((o) => {
        if (o.id === transformed?.id) return transformed
        return delta && ids.includes(o.id) ? { ...o, x: o.x + delta.x, y: o.y + delta.y } : o
      })
      return { ...layer, objects: layer.id === layerId ? [...objects, ...extra] : objects }
    }),
  }
}

// Prostokąt obiektu na ekranie, w px canvasu (bez obrotu).
function screenRect(object: SceneObject, zoom: number, offset: Point) {
  const halfWidth = (object.width * object.scaleX * zoom) / 2
  const halfHeight = (object.height * object.scaleY * zoom) / 2
  const x = offset.x + object.x * zoom
  const y = offset.y + object.y * zoom
  return { left: x - halfWidth, top: y - halfHeight, right: x + halfWidth, bottom: y + halfHeight }
}

// Czy punkt leży w prostokącie powiększonym z każdej strony o margin.
function near(point: Point, rect: ReturnType<typeof screenRect>, margin: number) {
  return (
    point.x >= rect.left - margin &&
    point.x <= rect.right + margin &&
    point.y >= rect.top - margin &&
    point.y <= rect.bottom + margin
  )
}

// Gdzie stoi etykieta: przy kursorze, ale nie dalej niż krawędź obiektu. Gdy obiekt zatrzyma się
// na brzegu mapy, a kursor pojedzie dalej, etykieta czeka przy obiekcie, aż kursor wróci.
function labelPoint(pointer: Point, object: SceneObject, zoom: number, offset: Point): Point {
  const rect = screenRect(object, zoom, offset)
  return {
    x: Math.min(Math.max(pointer.x, rect.left), rect.right),
    y: Math.min(Math.max(pointer.y, rect.top), rect.bottom),
  }
}

// Etykieta stoi na prawo i pod punktem `at`. Gdy przy prawej albo dolnej krawędzi canvasu brakuje
// miejsca, przechodzi na drugą stronę punktu, żeby nie schowała się pod panelem albo stopką.
// Strona zmienia się przez transform, więc CSS robi z tego krótkie przesunięcie zamiast skoku.
function labelStyle(at: Point, width: number, height: number, gap = LABEL_OFFSET) {
  const x = Math.min(Math.max(at.x, 0), width)
  const y = Math.min(Math.max(at.y, 0), height)
  const flipX = x + gap + LABEL_SPACE.x > width
  const flipY = y + gap + LABEL_SPACE.y > height
  const shift = (flip: boolean) => (flip ? `calc(-100% - ${gap}px)` : `${gap}px`)
  return { left: x, top: y, transform: `translate(${shift(flipX)}, ${shift(flipY)})` }
}

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const zoom = useEditorStore((s) => s.zoom)
  const gridSnap = useEditorStore((s) => s.gridSnap)
  const offset = useEditorStore((s) => s.offset)
  const setViewport = useEditorStore((s) => s.setViewport)
  const assets = useEditorStore((s) => s.assets)
  const activeLayerId = useEditorStore((s) => s.activeLayerId)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const setCursorPoint = useEditorStore((s) => s.setCursorPoint)
  // assetId → adres PNG. Obiekt, którego assetu nie ma w bibliotece, rysuje się jako czerwony prostokąt.
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, assetUrl(a.file)])), [assets])
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const view = useViewControls(ref)
  const selection = useSelectionControls(ref)
  const { drag } = selection
  const placing = usePalettePlacing(ref)
  const { ghost, floating, painted } = placing
  const eraser = useEraser(ref)
  const { erased } = eraser
  const painting = useEditorStore((s) => s.tool !== 'select')
  const nudgedId = useEditorShortcuts()
  const transform = useTransformControls()

  // Podczas przeciągania rysujemy obiekty w nowym miejscu (albo podgląd assetu z palety),
  // a podczas obracania i skalowania obiekt po zmianie.
  const shownScene = useMemo(
    () =>
      scene && (drag || ghost || painted.length > 0 || erased.length > 0 || transform.preview)
        ? previewScene(
            scene,
            selectedIds,
            drag?.delta ?? null,
            ghost ? [...painted, ghost.object] : painted,
            activeLayerId,
            transform.preview?.object ?? null,
            erased
          )
        : scene,
    [scene, selectedIds, drag, ghost, painted, erased, activeLayerId, transform.preview]
  )
  // Uchwyty obrotu i skali: tylko przy jednym zaznaczonym obiekcie na widocznej warstwie
  // i nie w trakcie przeciągania. Obiekt bierzemy ze sceny, bez podglądu.
  const handled =
    !painting && !drag && !ghost && selectedIds.length === 1
      ? scene?.layers
          .filter((layer) => layer.visible)
          .flatMap((layer) => layer.objects)
          .find((o) => o.id === selectedIds[0])
      : undefined
  // Ramki: zaznaczone obiekty (albo podgląd z palety) i te, z którymi by kolidowały.
  // Ukryte warstwy pomijamy.
  const { selected, collisions } = useMemo(() => {
    const objects = (shownScene?.layers ?? [])
      .filter((layer) => layer.visible)
      .flatMap((layer) => layer.objects)
    const collidesWith =
      drag?.collidesWith ?? ghost?.collidesWith ?? transform.preview?.collidesWith ?? []
    return {
      selected: ghost
        ? objects.filter((o) => o.id === ghost.object.id)
        : objects.filter((o) => selectedIds.includes(o.id)),
      collisions: objects.filter((o) => collidesWith.includes(o.id)),
    }
  }, [shownScene, selectedIds, drag, ghost, transform.preview])
  // Etykieta przy kursorze: środek chwyconego obiektu (albo podglądu), tak jak x, y w panelu właściwości.
  // Po ruchu strzałkami etykieta stoi przez chwilę przy prawym dolnym rogu przesuniętego obiektu.
  // Przy kilku zaznaczonych etykieta i kropka pokazują środek całej grupy, tak jak X, Y w panelu.
  const group = useMemo(() => {
    const box = !ghost && selected.length > 1 && shownScene && groupBox(shownScene, selectedIds)
    if (!box) return undefined
    // Udaje obiekt w miejscu prostokąta grupy, żeby etykieta i kropka liczyły się jak dla obiektu.
    const { x, y, width, height } = box
    return {
      ...selected[0],
      x: x + width / 2,
      y: y + height / 2,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    }
  }, [ghost, selected, shownScene, selectedIds])
  const nudged =
    !drag && !ghost && nudgedId ? (group ?? selected.find((o) => o.id === nudgedId)) : undefined
  const anchor = drag
    ? (group ?? selected.find((o) => o.id === drag.anchorId))
    : (ghost?.object ?? nudged)
  const pointer = drag?.pointer ?? ghost?.pointer
  const nudgedRect = nudged && screenRect(nudged, zoom, offset)
  const labelAt =
    anchor && pointer
      ? labelPoint(pointer, anchor, zoom, offset)
      : nudgedRect
        ? { x: nudgedRect.right, y: nudgedRect.bottom }
        : null
  // Przy przeciąganiu obiektu z mapy kursor nad nim znika, żeby nie zasłaniał kropki w środku.
  // Gdy obiekt stanie na brzegu mapy, a kursor pojedzie dalej, kursor wraca. Margines pół pola:
  // przy przyciąganiu obiekt odstaje od kursora najwyżej o tyle i kursor nie może wtedy mignąć.
  const hideCursor =
    drag &&
    pointer &&
    anchor &&
    scene &&
    near(pointer, screenRect(anchor, zoom, offset), (scene.gridSize / 2) * zoom)

  // Punkt mapy pod kursorem dla paska narzędzi (CursorPosition). Poza mapą: null.
  function trackCursor(event: PointerEvent<HTMLDivElement>) {
    const state = useEditorStore.getState()
    const rect = event.currentTarget.getBoundingClientRect()
    const p = toScenePoint({ x: event.clientX - rect.left, y: event.clientY - rect.top }, state)
    const x = Math.floor(p.x)
    const y = Math.floor(p.y)
    const inside =
      state.scene && x >= 0 && y >= 0 && x < state.scene.width && y < state.scene.height
    setCursorPoint(inside ? { x, y } : null)
  }

  // Panel właściwości pokazuje położenie, obrót i skalę na bieżąco, także w trakcie przeciągania.
  const setPreview = useEditorStore((s) => s.setPreview)
  const preview = drag || transform.preview ? shownScene : null
  useEffect(() => setPreview(preview), [preview, setPreview])

  // Store potrzebuje rozmiaru canvasu do zoomu w środku i „Dopasuj do ekranu”.
  useEffect(() => {
    if (width > 0 && height > 0) setViewport({ width, height })
  }, [width, height, setViewport])

  return (
    <div
      ref={ref}
      className={styles.canvas}
      style={{
        cursor:
          view.cursor ?? (hideCursor ? 'none' : drag ? 'move' : painting ? 'crosshair' : undefined),
      }}
      // Najpierw widok, potem pędzel: gdy któryś obsłuży kliknięcie, zaznaczanie je pomija
      // (defaultPrevented).
      onPointerDown={(e) => {
        view.handlers.onPointerDown(e)
        placing.onPointerDown(e)
        eraser.onPointerDown(e)
        selection.handlers.onPointerDown(e)
      }}
      onPointerMove={(e) => {
        view.handlers.onPointerMove(e)
        selection.handlers.onPointerMove(e)
        trackCursor(e)
      }}
      onPointerLeave={() => setCursorPoint(null)}
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
            // Obie liczby tylko rosną, więc suma zmienia się przy każdym odrzuceniu.
            shakeKey={selection.shakeKey + transform.shakeKey}
            // Kropka w środku obiektu, którego współrzędne pokazuje etykieta.
            center={labelAt ? anchor : null}
            zoom={zoom}
          />
          {handled && (
            <SelectionTransformer
              object={handled}
              bounds={shownScene}
              zoom={zoom}
              scaleLimits={SCALE_LIMITS}
              snap={gridSnap ? shownScene.gridSize : undefined}
              onTransform={(t) => transform.onTransform(handled.id, t)}
              onTransformEnd={(t) => transform.onTransformEnd(handled.id, t)}
            />
          )}
        </SceneRenderer>
      )}
      {/* Asset z palety przy kursorze, zanim dojedzie nad canvas (w rozmiarze po zoomie). */}
      {floating && (
        <img
          src={assetUrl(floating.asset.file)}
          alt=""
          crossOrigin="anonymous"
          className={styles.floating}
          style={{
            left: floating.at.x,
            top: floating.at.y,
            width: floating.asset.width * zoom,
            height: floating.asset.height * zoom,
          }}
        />
      )}
      {anchor && labelAt && (
        <div
          className={styles.coords}
          style={labelStyle(labelAt, width, height, pointer ? LABEL_OFFSET : NUDGE_LABEL_OFFSET)}
        >
          {anchor.x}, {anchor.y}
        </div>
      )}
    </div>
  )
}
