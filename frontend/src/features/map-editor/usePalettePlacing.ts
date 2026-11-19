// Przeciąganie assetu z palety na mapę (F-31, poprawione w F-33). Paleta ustawia placingAsset
// w store, a ten hook śledzi kursor w całym oknie: nad mapą pokazuje podgląd obiektu
// (z przyciąganiem i kolizją), a poza nią sam obrazek assetu przy kursorze (floating).
// Puszczenie przycisku nad mapą dodaje obiekt, a Esc albo puszczenie poza nią anuluje.
// Liczy się sama mapa, nie cały canvas: pusty pas canvasu wokół mapy też jest „poza”.
// Drugi tryb to pędzel (narzędzie „brush” i asset z palety): podgląd jedzie za kursorem nad mapą,
// a kliknięcie w mapę stawia obiekt (onPointerDown wołany przez MapCanvas). Z wciśniętym przyciskiem
// pędzel maluje: obiekt staje w każdym wolnym miejscu, przez które przejedzie kursor. Całe pociągnięcie
// trafia do sceny po puszczeniu przycisku, jednym krokiem cofania. Esc porzuca pociągnięcie.
// Narzędzie „Prostokąt” działa tak samo, tylko pociągnięcie to wszystkie wolne pola w prostokącie
// od miejsca wciśnięcia przycisku do kursora.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { toast } from '@/shared/components/ui/Toast/toast'
import type { Asset } from '@/shared/lib/assets'
import type { Point, SceneObject } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { toScenePoint } from './view'

// Podgląd: obiekt, który powstałby po upuszczeniu, kursor w px canvasu i kolizje.
export interface PlacingGhost {
  object: SceneObject
  pointer: Point
  collidesWith: string[]
}

// Obrazek assetu przy kursorze, zanim kursor dojedzie do canvasu. Punkt w px okna.
export interface PlacingFloat {
  asset: Asset
  at: Point
}

// Id obiektu-podglądu. Nie trafia do sceny w store, tylko do sceny pokazywanej na ekranie.
export const GHOST_ID = 'palette-ghost'

// Kursor nad mapą: w px canvasu i jako punkt sceny. Null, gdy kursor jest poza mapą.
function overMap(
  element: HTMLElement | null,
  event: { clientX: number; clientY: number }
): { pointer: Point; at: Point } | null {
  const rect = element?.getBoundingClientRect()
  const state = useEditorStore.getState()
  if (!rect || !state.scene) return null
  const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  const at = toScenePoint(pointer, state)
  const inside = at.x >= 0 && at.y >= 0 && at.x <= state.scene.width && at.y <= state.scene.height
  return inside ? { pointer, at } : null
}

// Podgląd assetu w punkcie mapy, z przyciąganiem i kolizją.
function ghostAt(asset: Asset, hit: { pointer: Point; at: Point }): PlacingGhost {
  const plan = useEditorStore.getState().planAdd(asset, hit.at)
  return {
    object: {
      id: GHOST_ID,
      assetId: asset.id,
      ...plan.at,
      width: asset.width,
      height: asset.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    pointer: hit.pointer,
    collidesWith: plan.result.ok ? [] : plan.result.collidesWith,
  }
}

// Id podglądu obiektu namalowanego w trwającym pociągnięciu (jeszcze nie w scenie).
const paintedId = (index: number) => `${GHOST_ID}-${index}`

// Namalowane obiekty, na które nachodzi podgląd pod kursorem (dostają bursztynową ramkę).
// Pomijamy obiekt postawiony właśnie w tym miejscu, żeby ramka nie świeciła przy każdym kroku.
function paintedCollisions(ghost: SceneObject, centers: Point[]): string[] {
  return centers.flatMap((center, index) => {
    const justPainted = index === centers.length - 1 && center.x === ghost.x && center.y === ghost.y
    const overlaps =
      Math.abs(center.x - ghost.x) < ghost.width && Math.abs(center.y - ghost.y) < ghost.height
    return overlaps && !justPainted ? [paintedId(index)] : []
  })
}

// Środki pól prostokąta od pola startu (środek start) do punktu to. Pola mają rozmiar assetu
// zaokrąglony w górę do siatki (przy przyciąganiu), więc nie nachodzą na siebie ani nie zjeżdżają z siatki.
// Pola wystające poza mapę pomijamy.
function rectCells(asset: Asset, start: Point, to: Point): Point[] {
  const { scene, gridSnap } = useEditorStore.getState()
  if (!scene) return []
  const step = (size: number) =>
    gridSnap ? Math.ceil(size / scene.gridSize) * scene.gridSize : size
  const range = (from: number, target: number, size: number, max: number) => {
    const s = step(size)
    const last = Math.floor((target - (from - size / 2)) / s)
    const values: number[] = []
    for (let i = Math.min(0, last); i <= Math.max(0, last); i++) {
      const center = from + i * s
      if (center - size / 2 >= 0 && center + size / 2 <= max) values.push(center)
    }
    return values
  }
  const xs = range(start.x, to.x, asset.width, scene.width)
  const ys = range(start.y, to.y, asset.height, scene.height)
  return ys.flatMap((y) => xs.map((x) => ({ x, y })))
}

// Stawia asset w punkcie mapy. Przy kolizji niczego nie zmienia i pokazuje komunikat.
function place(asset: Asset, at: Point) {
  if (!useEditorStore.getState().addAsset(asset, at).ok) toast.error('errors.collision')
}

export function usePalettePlacing(ref: RefObject<HTMLElement | null>) {
  const placingAsset = useEditorStore((s) => s.placingAsset)
  // Asset z palety, tylko gdy wybrane jest narzędzie, które nim maluje.
  const brush = useEditorStore((s) => (s.tool === 'brush' || s.tool === 'rect' ? s.brush : null))
  const rect = useEditorStore((s) => s.tool === 'rect')
  const [ghost, setGhost] = useState<PlacingGhost | null>(null)
  const [floating, setFloating] = useState<PlacingFloat | null>(null)
  // Środki obiektów namalowanych w trwającym pociągnięciu pędzla. Null: przycisk nie jest wciśnięty.
  const stroke = useRef<Point[] | null>(null)
  const [painted, setPainted] = useState<Point[]>([])
  // Prostokąt: środek pierwszego pola, od którego ciągniemy.
  const rectStart = useRef<Point | null>(null)

  // Przeciąganie kafelka z palety.
  useEffect(() => {
    if (!placingAsset) return
    const asset = placingAsset

    function onMove(event: PointerEvent) {
      const hit = overMap(ref.current, event)
      if (!hit) {
        setGhost(null)
        setFloating({ asset, at: { x: event.clientX, y: event.clientY } })
        return
      }
      setFloating(null)
      setGhost(ghostAt(asset, hit))
    }

    function finish() {
      setGhost(null)
      setFloating(null)
      useEditorStore.getState().setPlacingAsset(null)
    }

    function onUp(event: PointerEvent) {
      const hit = overMap(ref.current, event)
      if (hit) place(asset, hit.at)
      finish()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') finish()
    }

    // Kursor „chwytający” w całym oknie, także nad paletą.
    document.body.style.cursor = 'grabbing'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [placingAsset, ref])

  // Pędzel: podgląd za kursorem nad mapą. Przeciąganie z palety ma pierwszeństwo.
  useEffect(() => {
    if (!brush || placingAsset) return
    const asset = brush

    function onMove(event: PointerEvent) {
      const hit = overMap(ref.current, event)
      if (!hit) return setGhost(null)
      if (stroke.current && rectStart.current) {
        // Prostokąt: zamiast podglądu pod kursorem widać pola, które zostaną wypełnione.
        fillRect(asset, rectStart.current, hit.at)
        return setGhost(null)
      }
      // Podgląd z ramką zostaje pod kursorem także w trakcie malowania. Kolizje liczymy wtedy
      // także z obiektami namalowanymi w tym pociągnięciu.
      if (stroke.current) paint(stroke.current, asset, hit.at)
      const next = ghostAt(asset, hit)
      if (stroke.current) {
        next.collidesWith = [
          ...next.collidesWith,
          ...paintedCollisions(next.object, stroke.current),
        ]
      }
      setGhost(next)
    }

    function onUp(event: PointerEvent) {
      const centers = stroke.current
      if (!centers) return
      stroke.current = null
      rectStart.current = null
      setPainted([])
      if (centers.length > 0) useEditorStore.getState().addPainted(asset, centers)
      // Nowe obiekty stoją pod kursorem, więc podgląd od razu pokazuje kolizję z nimi.
      const hit = overMap(ref.current, event)
      setGhost(hit && ghostAt(asset, hit))
    }

    // Esc w trakcie malowania porzuca całe pociągnięcie. Narzędzie zmienia tylko panel i V/B.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !stroke.current) return
      stroke.current = null
      rectStart.current = null
      setPainted([])
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      // Zmiana narzędzia w trakcie malowania porzuca całe pociągnięcie.
      stroke.current = null
      rectStart.current = null
      setPainted([])
      setGhost(null)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [brush, rect, placingAsset, ref])

  // Pociągnięcie prostokątem: każde pole sprawdzamy osobno ze sceną (pola nie nachodzą na siebie).
  function fillRect(asset: Asset, start: Point, to: Point) {
    const { planAdd } = useEditorStore.getState()
    const centers = rectCells(asset, start, to).filter((center) => {
      const plan = planAdd(asset, center)
      return plan.result.ok && plan.at.x === center.x && plan.at.y === center.y
    })
    stroke.current = centers
    setPainted(centers)
  }

  // Dokłada obiekt do pociągnięcia, jeśli w tym miejscu nie koliduje ze sceną ani z resztą pociągnięcia.
  function paint(centers: Point[], asset: Asset, at: Point): boolean {
    const plan = useEditorStore.getState().planAdd(asset, at, centers)
    if (!plan.result.ok) return false
    centers.push(plan.at)
    setPainted([...centers])
    return true
  }

  // Wciśnięcie przycisku nad mapą z pędzlem zaczyna malowanie. preventDefault: zaznaczanie to pomija.
  function onPointerDown(event: ReactPointerEvent) {
    if (!brush || event.defaultPrevented || event.button !== 0) return
    event.preventDefault()
    const hit = overMap(ref.current, event)
    if (!hit) return
    stroke.current = []
    if (rect) {
      rectStart.current = useEditorStore.getState().planAdd(brush, hit.at).at
      return fillRect(brush, rectStart.current, hit.at)
    }
    // Komunikat tylko przy pierwszym miejscu. Dalej zajęte miejsca są po prostu pomijane.
    if (!paint(stroke.current, brush, hit.at)) toast.error('errors.collision')
  }

  // Namalowane obiekty jako podgląd na ekranie (do sceny trafiają po puszczeniu przycisku).
  const paintedObjects = useMemo<SceneObject[]>(
    () =>
      brush
        ? painted.map((center, index) => ({
            id: paintedId(index),
            assetId: brush.id,
            ...center,
            width: brush.width,
            height: brush.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          }))
        : [],
    [brush, painted]
  )

  return { ghost, floating, painted: paintedObjects, onPointerDown }
}
