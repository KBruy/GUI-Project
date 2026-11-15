// Zaznaczanie obiektów myszą i klawiaturą (F-32):
// - klik w obiekt: zaznacza go (najwyższy pod kursorem), klik w puste miejsce: czyści zaznaczenie,
// - Shift + klik: dodaje obiekt do zaznaczenia albo go z niego zdejmuje,
// - przeciągnięcie po pustym miejscu: prostokąt zaznaczenia (z Shiftem dokłada do zaznaczenia),
// - Esc: czyści zaznaczenie,
// - przeciągnięcie obiektu: przesuwa całe zaznaczenie (F-33), z podglądem kolizji przed upuszczeniem;
//   upuszczenie na zajęte miejsce zostawia obiekty, pokazuje toast i potrząsa ramkami.
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { SelectionRect } from '@/shared/canvas/SelectionLayer'
import { toast } from '@/shared/components/ui/Toast/toast'
import type { Point } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { isTyping } from './useViewControls'
import { toScenePoint } from './view'

// Krótsze przeciągnięcie (w pikselach ekranu) to zwykłe kliknięcie, a nie prostokąt.
const DRAG_THRESHOLD = 3

// Prostokąt między dwoma punktami, niezależnie od kierunku przeciągania.
function rectBetween(a: Point, b: Point): SelectionRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

// Podgląd przeciągania: o ile przesuwamy zaznaczenie i z czym by kolidowało po upuszczeniu.
export interface DragPreview {
  delta: Point
  collidesWith: string[]
  // Chwycony obiekt (jego współrzędne pokazuje etykieta) i kursor w px względem canvasu.
  anchorId: string
  pointer: Point
}

export function useSelectionControls(ref: RefObject<HTMLElement | null>) {
  const select = useEditorStore((s) => s.select)
  const selectAt = useEditorStore((s) => s.selectAt)
  const selectInRect = useEditorStore((s) => s.selectInRect)
  // Początek przeciągania po pustym miejscu: punkt ekranu i sceny oraz czy był wciśnięty Shift.
  const start = useRef<{ screen: Point; scene: Point; add: boolean } | null>(null)
  const [marquee, setMarquee] = useState<SelectionRect | null>(null)
  // Początek przeciągania obiektu: chwycony obiekt i czy był zaznaczony już wcześniej.
  const grab = useRef<{ screen: Point; scene: Point; id: string; wasSelected: boolean } | null>(
    null
  )
  const [drag, setDrag] = useState<DragPreview | null>(null)
  // Rośnie przy każdym upuszczeniu na zajęte miejsce, SelectionLayer wtedy potrząsa ramkami.
  const [shakeKey, setShakeKey] = useState(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isTyping(event.target)) select([])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [select])

  // Punkt pod kursorem: ekranu (względem canvasu) i sceny (po zoomie i przesunięciu).
  function pointsOf(event: PointerEvent) {
    const rect = ref.current!.getBoundingClientRect()
    const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    return { screen, scene: toScenePoint(screen, useEditorStore.getState()) }
  }

  function onPointerDown(event: PointerEvent) {
    // defaultPrevented: to kliknięcie zaczęło przesuwanie widoku (spacja, środkowy przycisk).
    if (event.defaultPrevented || event.button !== 0 || !ref.current) return
    if (!useEditorStore.getState().scene) return
    const { screen, scene } = pointsOf(event)
    const { objectAt, selectedIds } = useEditorStore.getState()
    const hit = objectAt(scene)
    event.currentTarget.setPointerCapture(event.pointerId)

    if (hit && !event.shiftKey) {
      // Chwycony obiekt spoza zaznaczenia staje się jedynym zaznaczonym. Chwycony zaznaczony
      // zostawia zaznaczenie, żeby dało się przeciągnąć kilka obiektów naraz.
      const wasSelected = selectedIds.includes(hit)
      if (!wasSelected) select([hit])
      grab.current = { screen, scene, id: hit, wasSelected }
      return
    }
    // Shift + klik w obiekt przełącza go. Puste miejsce bez Shifta czyści zaznaczenie.
    if (selectAt(scene, event.shiftKey)) return
    start.current = { screen, scene, add: event.shiftKey }
  }

  function onPointerMove(event: PointerEvent) {
    if (grab.current) {
      const { screen, scene } = pointsOf(event)
      const from = grab.current
      const moved = Math.hypot(screen.x - from.screen.x, screen.y - from.screen.y)
      if (!drag && moved < DRAG_THRESHOLD) return
      const plan = useEditorStore
        .getState()
        .planMove({ x: scene.x - from.scene.x, y: scene.y - from.scene.y }, from.id)
      setDrag({
        delta: plan.delta,
        collidesWith: plan.result.ok ? [] : plan.result.collidesWith,
        anchorId: from.id,
        pointer: screen,
      })
      return
    }
    if (!start.current) return
    const { screen, scene } = pointsOf(event)
    const moved = Math.hypot(screen.x - start.current.screen.x, screen.y - start.current.screen.y)
    if (marquee || moved >= DRAG_THRESHOLD) setMarquee(rectBetween(start.current.scene, scene))
  }

  function stop() {
    start.current = null
    grab.current = null
    setMarquee(null)
    setDrag(null)
  }

  function onPointerUp() {
    if (marquee && start.current) selectInRect(marquee, start.current.add)
    if (grab.current && drag) {
      // Upuszczenie: przy kolizji obiekty zostają na starym miejscu.
      if (drag.collidesWith.length > 0) {
        toast.error('errors.collision')
        setShakeKey((key) => key + 1)
      } else {
        useEditorStore.getState().moveSelected(drag.delta)
      }
    } else if (grab.current?.wasSelected) {
      // Zwykły klik (bez przeciągania) w zaznaczony obiekt zostawia zaznaczony tylko jego.
      select([grab.current.id])
    }
    stop()
  }

  return {
    marquee,
    drag,
    shakeKey,
    // Przerwane przeciąganie (np. utrata okna) nie zmienia zaznaczenia.
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: stop },
  }
}
