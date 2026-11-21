// Narzędzie „Gumka”: wciśnięty przycisk i ruch po mapie zbierają obiekty pod kursorem. Na ekranie
// znikają od razu, a ze sceny po puszczeniu przycisku, jednym krokiem cofania. Esc w trakcie
// porzuca całe pociągnięcie.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { removeObjects } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { toScenePoint } from './view'

export function useEraser(ref: RefObject<HTMLElement | null>) {
  const active = useEditorStore((s) => s.tool === 'eraser' && s.scene !== null)
  // Id obiektów startych w trwającym pociągnięciu. Null: przycisk nie jest wciśnięty.
  const stroke = useRef<string[] | null>(null)
  const [erased, setErased] = useState<string[]>([])

  // Dokłada do pociągnięcia obiekt pod kursorem (najwyższy, jak przy zaznaczaniu).
  const erase = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect || !stroke.current) return
      const state = useEditorStore.getState()
      const point = toScenePoint(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        state
      )
      const hit = state.objectAt(point)
      if (!hit || stroke.current.includes(hit)) return
      stroke.current = [...stroke.current, hit]
      setErased(stroke.current)
    },
    [ref]
  )

  useEffect(() => {
    if (!active) return

    function onUp() {
      const ids = stroke.current
      if (!ids) return
      stroke.current = null
      setErased([])
      if (ids.length > 0) useEditorStore.getState().execute(removeObjects(ids))
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !stroke.current) return
      stroke.current = null
      setErased([])
    }

    window.addEventListener('pointermove', erase)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      stroke.current = null
      setErased([])
      window.removeEventListener('pointermove', erase)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active, erase])

  // Wciśnięcie przycisku nad mapą zaczyna ścieranie. preventDefault: zaznaczanie to pomija.
  function onPointerDown(event: ReactPointerEvent) {
    if (!active || event.defaultPrevented || event.button !== 0) return
    event.preventDefault()
    stroke.current = []
    erase(event)
  }

  return { erased, onPointerDown }
}
