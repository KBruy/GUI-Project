// Sterowanie widokiem canvasu myszą i klawiaturą (F-28):
// - kółko myszy: zoom w miejscu kursora,
// - + i −: zoom w środku canvasu,
// - spacja z przeciąganiem albo środkowy przycisk myszy: przesuwanie widoku.
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { useEditorStore } from './store/editorStore'

// Jeden krok zoomu (kółko albo klawisz) to 25%.
export const ZOOM_STEP = 1.25

// Skróty klawiszowe edytora nie mogą działać, gdy ktoś pisze w polu formularza.
export function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function useViewControls(ref: RefObject<HTMLElement | null>) {
  const zoomTo = useEditorStore((s) => s.zoomTo)
  const panBy = useEditorStore((s) => s.panBy)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  // Ostatnia pozycja kursora podczas przesuwania.
  const last = useRef({ x: 0, y: 0 })

  // Kółko: React rejestruje wheel jako pasywny, a my musimy zablokować przewijanie strony.
  useEffect(() => {
    const element = ref.current
    if (!element) return
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const rect = element!.getBoundingClientRect()
      const zoom = useEditorStore.getState().zoom
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      zoomTo(zoom * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [ref, zoomTo])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return
      const zoom = useEditorStore.getState().zoom
      if (event.code === 'Space') {
        // Bez tego spacja przewija stronę albo „klika” przycisk z fokusem.
        event.preventDefault()
        setSpaceDown(true)
      } else if (event.key === '+' || event.key === '=') {
        zoomTo(zoom * ZOOM_STEP)
      } else if (event.key === '-') {
        zoomTo(zoom / ZOOM_STEP)
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [zoomTo])

  function onPointerDown(event: PointerEvent) {
    const middle = event.button === 1
    if (!middle && !(spaceDown && event.button === 0)) return
    event.preventDefault()
    // Kursor może wyjechać poza canvas, a przesuwanie i tak trwa do puszczenia przycisku.
    event.currentTarget.setPointerCapture(event.pointerId)
    last.current = { x: event.clientX, y: event.clientY }
    setPanning(true)
  }

  function onPointerMove(event: PointerEvent) {
    if (!panning) return
    panBy(event.clientX - last.current.x, event.clientY - last.current.y)
    last.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp() {
    setPanning(false)
  }

  return {
    // „grab” = można chwycić widok, „grabbing” = właśnie przesuwamy.
    cursor: panning ? 'grabbing' : spaceDown ? 'grab' : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
