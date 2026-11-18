// Przeciąganie assetu z palety na mapę (F-31, poprawione w F-33). Paleta ustawia placingAsset
// w store, a ten hook śledzi kursor w całym oknie: nad mapą pokazuje podgląd obiektu
// (z przyciąganiem i kolizją), a poza nią sam obrazek assetu przy kursorze (floating).
// Puszczenie przycisku nad mapą dodaje obiekt, a Esc albo puszczenie poza nią anuluje.
// Liczy się sama mapa, nie cały canvas: pusty pas canvasu wokół mapy też jest „poza”.
import { useEffect, useState, type RefObject } from 'react'
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

export function usePalettePlacing(ref: RefObject<HTMLElement | null>) {
  const placingAsset = useEditorStore((s) => s.placingAsset)
  const [ghost, setGhost] = useState<PlacingGhost | null>(null)
  const [floating, setFloating] = useState<PlacingFloat | null>(null)

  useEffect(() => {
    if (!placingAsset) return
    const asset = placingAsset

    // Kursor nad mapą: w px canvasu i jako punkt sceny. Null, gdy kursor jest poza mapą.
    function overMap(event: PointerEvent): { pointer: Point; at: Point } | null {
      const rect = ref.current?.getBoundingClientRect()
      const state = useEditorStore.getState()
      if (!rect || !state.scene) return null
      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      const at = toScenePoint(pointer, state)
      const inside =
        at.x >= 0 && at.y >= 0 && at.x <= state.scene.width && at.y <= state.scene.height
      return inside ? { pointer, at } : null
    }

    function onMove(event: PointerEvent) {
      const hit = overMap(event)
      if (!hit) {
        setGhost(null)
        setFloating({ asset, at: { x: event.clientX, y: event.clientY } })
        return
      }
      setFloating(null)
      const plan = useEditorStore.getState().planAdd(asset, hit.at)
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
        pointer: hit.pointer,
        collidesWith: plan.result.ok ? [] : plan.result.collidesWith,
      })
    }

    function finish() {
      setGhost(null)
      setFloating(null)
      useEditorStore.getState().setPlacingAsset(null)
    }

    function onUp(event: PointerEvent) {
      const hit = overMap(event)
      if (hit && !useEditorStore.getState().addAsset(asset, hit.at).ok) {
        toast.error('errors.collision')
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

  return { ghost, floating }
}
