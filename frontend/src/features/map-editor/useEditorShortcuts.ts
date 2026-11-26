// Skróty klawiszowe edytora map (F-33, F-37). Klawisze są w `config/hotkeys.ts`:
// - strzałki: przesuwają zaznaczone obiekty o 1 px, a przy włączonym przyciąganiu do następnej
//   linii siatki. Shift+strzałka zawsze przesuwa o jedno pole siatki (32 px),
// - cofnij, ponów, zapisz (F-38), usuń zaznaczone,
// - narzędzia z panelu „Narzędzia”, Esc: powrót do zaznaczania.
// Zwraca id obiektu przesuniętego strzałkami: canvas pokazuje przy nim przez chwilę jego (x, y).
import { useEffect, useRef, useState } from 'react'
import { hotkeyIndex, isHotkey, type HotkeyAction } from '@/config/hotkeys'
import { toast } from '@/shared/components/ui/Toast/toast'
import { saveProject } from './saveProject'
import { useEditorStore, type Tool } from './store/editorStore'
import { isTyping } from './useViewControls'

// Kierunki w kolejności kombinacji `nudge` i `nudgeFar` z hotkeys.ts.
const DIRECTIONS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
]
const TOOL_HOTKEYS: Record<Tool, HotkeyAction> = {
  select: 'toolSelect',
  brush: 'toolBrush',
  rect: 'toolRect',
  fill: 'toolFill',
  eraser: 'toolEraser',
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
      // Zapis zawsze blokujemy, bo inaczej przeglądarka zapisuje całą stronę jako plik HTML.
      if (isHotkey(event, 'save')) {
        event.preventDefault()
        // Przytrzymane klawisze powtarzają zdarzenie, a zapis wystarczy jeden.
        if (!event.repeat && !document.querySelector('dialog[open]')) void saveProject()
        return
      }
      // Skróty nie działają w polach formularza ani przy otwartym oknie (np. „Nowa mapa”).
      if (isTyping(event.target) || document.querySelector('dialog[open]')) return
      const { scene, selectedIds, gridSnap, moveSelected, deleteSelected, undo, redo, setTool } =
        useEditorStore.getState()
      if (!scene) return

      if (isHotkey(event, 'undo')) {
        event.preventDefault()
        undo()
        return
      }
      if (isHotkey(event, 'redo')) {
        event.preventDefault()
        redo()
        return
      }

      // Esc w trakcie malowania przerywa też pociągnięcie (pędzel i gumka mają własne nasłuchy).
      if (isHotkey(event, 'cancel')) {
        setTool('select')
        return
      }

      const tool = (Object.keys(TOOL_HOTKEYS) as Tool[]).find((t) =>
        isHotkey(event, TOOL_HOTKEYS[t])
      )
      if (tool) {
        setTool(tool)
        return
      }

      if (isHotkey(event, 'delete')) {
        event.preventDefault()
        deleteSelected()
        return
      }

      const farIndex = hotkeyIndex(event, 'nudgeFar')
      const far = farIndex !== -1
      const direction = DIRECTIONS[far ? farIndex : hotkeyIndex(event, 'nudge')]
      if (!direction || selectedIds.length === 0) return
      // Bez tego strzałki przewijają stronę.
      event.preventDefault()
      let delta: { x: number; y: number }
      if (gridSnap && !far) {
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
        const step = far ? scene.gridSize : 1
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
