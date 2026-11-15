// Zaznaczanie obiektów myszą i klawiaturą (F-32):
// - klik w obiekt: zaznacza go (najwyższy pod kursorem), klik w puste miejsce: czyści zaznaczenie,
// - Shift + klik: dodaje obiekt do zaznaczenia albo go z niego zdejmuje,
// - przeciągnięcie po pustym miejscu: prostokąt zaznaczenia (z Shiftem dokłada do zaznaczenia),
// - Esc: czyści zaznaczenie.
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { Point } from './engine/engine'
import type { SelectionRect } from '@/shared/canvas/SelectionLayer'
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

export function useSelectionControls(ref: RefObject<HTMLElement | null>) {
  const select = useEditorStore((s) => s.select)
  const selectAt = useEditorStore((s) => s.selectAt)
  const selectInRect = useEditorStore((s) => s.selectInRect)
  // Początek przeciągania po pustym miejscu: punkt ekranu i sceny oraz czy był wciśnięty Shift.
  const start = useRef<{ screen: Point; scene: Point; add: boolean } | null>(null)
  const [marquee, setMarquee] = useState<SelectionRect | null>(null)

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
    // Trafiony obiekt zostaje zaznaczony od razu. Puste miejsce bez Shifta czyści zaznaczenie.
    if (selectAt(scene, event.shiftKey)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { screen, scene, add: event.shiftKey }
  }

  function onPointerMove(event: PointerEvent) {
    if (!start.current) return
    const { screen, scene } = pointsOf(event)
    const moved = Math.hypot(screen.x - start.current.screen.x, screen.y - start.current.screen.y)
    if (marquee || moved >= DRAG_THRESHOLD) setMarquee(rectBetween(start.current.scene, scene))
  }

  function stop() {
    start.current = null
    setMarquee(null)
  }

  function onPointerUp() {
    if (marquee && start.current) selectInRect(marquee, start.current.add)
    stop()
  }

  return {
    marquee,
    // Przerwane przeciąganie (np. utrata okna) nie zmienia zaznaczenia.
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: stop },
  }
}
