// Skróty klawiszowe edytora map (F-33):
// - strzałki: przesuwają zaznaczone obiekty o 1 px, z Shiftem o jedno pole siatki (32 px),
//   a przy włączonym przyciąganiu zawsze do następnej linii siatki,
// - Ctrl+Z (na Macu Cmd+Z): cofnij, Ctrl+Shift+Z albo Ctrl+Y: ponów,
// - Ctrl+S (Cmd+S): zapisz mapę (F-38),
// - Delete albo Backspace: usuń zaznaczone obiekty.
// Zwraca id obiektu przesuniętego strzałkami: canvas pokazuje przy nim przez chwilę jego (x, y).
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/shared/components/ui/Toast/toast'
import { saveProject } from './saveProject'
import { useEditorStore } from './store/editorStore'
import { isTyping } from './useViewControls'

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}
// Jak długo po ostatniej strzałce widać etykietę ze współrzędnymi.
const NUDGE_LABEL_MS = 1500

// Ile trzeba przesunąć krawędź `edge`, żeby trafiła na następną linię siatki w kierunku `direction`.
// Krawędź już na linii przeskakuje o całe pole, a krawędź między liniami dociąga do najbliższej.
function toNextGridLine(edge: number, direction: number, size: number): number {
  if (direction === 0) return 0
  const line =
    direction > 0 ? (Math.floor(edge / size) + 1) * size : (Math.ceil(edge / size) - 1) * size
  return line - edge
}

export function useEditorShortcuts(): string | null {
  const [nudgedId, setNudgedId] = useState<string | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl+S zawsze blokujemy, bo inaczej przeglądarka zapisuje całą stronę jako plik HTML.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        // Przytrzymane klawisze powtarzają zdarzenie, a zapis wystarczy jeden.
        if (!event.repeat && !document.querySelector('dialog[open]')) void saveProject()
        return
      }
      // Skróty nie działają w polach formularza ani przy otwartym oknie (np. „Nowa mapa”).
      if (isTyping(event.target) || document.querySelector('dialog[open]')) return
      const { scene, selectedIds, gridSnap, moveSelected, deleteSelected, undo, redo } =
        useEditorStore.getState()
      if (!scene) return

      const key = event.key.toLowerCase()
      if (event.ctrlKey || event.metaKey) {
        if (key === 'z' && !event.shiftKey) undo()
        else if ((key === 'z' && event.shiftKey) || key === 'y') redo()
        else return
        event.preventDefault()
        return
      }

      // Backspace, bo na Macu nie ma osobnego klawisza Delete.
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelected()
        return
      }

      const direction = ARROWS[event.key]
      if (!direction || selectedIds.length === 0) return
      // Bez tego strzałki przewijają stronę.
      event.preventDefault()
      let delta: { x: number; y: number }
      if (gridSnap) {
        // Lewy górny róg pierwszego zaznaczonego obiektu trafia na siatkę, tak jak przy dodawaniu z palety.
        const first = scene.layers
          .flatMap((layer) => layer.objects)
          .find((object) => object.id === selectedIds[0])!
        const left = first.x - (first.width * first.scaleX) / 2
        const top = first.y - (first.height * first.scaleY) / 2
        delta = {
          x: toNextGridLine(left, direction.x, scene.gridSize),
          y: toNextGridLine(top, direction.y, scene.gridSize),
        }
      } else {
        const step = event.shiftKey ? scene.gridSize : 1
        delta = { x: direction.x * step, y: direction.y * step }
      }
      const result = moveSelected(delta)
      // Przytrzymana strzałka powtarza zdarzenie, a wystarczy jeden komunikat.
      if (!result.ok && !event.repeat) toast.error('errors.collision')
      // Etykieta przy pierwszym zaznaczonym, także przy kolizji (widać, gdzie obiekt został).
      setNudgedId(selectedIds[0])
      window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => setNudgedId(null), NUDGE_LABEL_MS)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  return nudgedId
}
