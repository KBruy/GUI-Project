// Przeciąganie assetu z palety na mapę (F-31, poprawione w F-33). Paleta ustawia placingAsset
// w store, a ten hook śledzi kursor w całym oknie: nad canvasem pokazuje podgląd obiektu
// (z przyciąganiem i kolizją), a puszczenie przycisku nad canvasem dodaje obiekt. Esc anuluje.
import { useEffect, useState, type RefObject } from 'react'
import { toast } from '@/shared/components/ui/Toast/toast'
import type { Point, SceneObject } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { toScenePoint } from './view'

// Podgląd: obiekt, który powstałby po upuszczeniu, kursor w px canvasu i kolizje.
export interface PlacingGhost {
  object: SceneObject
  pointer: Point
  collidesWith: string[]
}

// Id obiektu-podglądu. Nie trafia do sceny w store, tylko do sceny pokazywanej na ekranie.
export const GHOST_ID = 'palette-ghost'

export function usePalettePlacing(ref: RefObject<HTMLElement | null>) {
  const placingAsset = useEditorStore((s) => s.placingAsset)
  const [ghost, setGhost] = useState<PlacingGhost | null>(null)

  useEffect(() => {
    if (!placingAsset) return
    const asset = placingAsset

    // Kursor w px względem canvasu albo null, gdy jest poza nim (np. nad paletą).
    function local(event: PointerEvent): Point | null {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return null
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null
    }

    function onMove(event: PointerEvent) {
      const pointer = local(event)
      if (!pointer) return setGhost(null)
      const state = useEditorStore.getState()
      const plan = state.planAdd(asset, toScenePoint(pointer, state))
      setGhost({
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
        pointer,
        collidesWith: plan.result.ok ? [] : plan.result.collidesWith,
      })
    }

    function finish() {
      setGhost(null)
      useEditorStore.getState().setPlacingAsset(null)
    }

    function onUp(event: PointerEvent) {
      const pointer = local(event)
      if (pointer) {
        const state = useEditorStore.getState()
        if (!state.addAsset(asset, toScenePoint(pointer, state)).ok) toast.error('errors.collision')
      }
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

  return ghost
}
