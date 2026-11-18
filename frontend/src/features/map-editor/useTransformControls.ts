// Obracanie i skalowanie zaznaczonego obiektu uchwytami (F-34). Podgląd w trakcie pokazuje
// obiekt po zaokrągleniach ze store'u i to, z czym by kolidował. Koniec zapisuje zmianę jednym
// krokiem cofania, a przy kolizji obiekt wraca, jak przy przeciąganiu: toast i drżenie ramek.
import { useState } from 'react'
import type { ObjectTransform } from '@/shared/canvas/SelectionTransformer'
import { toast } from '@/shared/components/ui/Toast/toast'
import type { SceneObject } from './engine/engine'
import { useEditorStore } from './store/editorStore'

// Obiekt w trakcie obracania albo skalowania, z wartościami gotowymi do zapisu.
export interface TransformPreview {
  object: SceneObject
  collidesWith: string[]
}

export function useTransformControls() {
  const [preview, setPreview] = useState<TransformPreview | null>(null)
  // Rośnie przy każdej zmianie odrzuconej przez kolizję, SelectionLayer wtedy potrząsa ramkami.
  const [shakeKey, setShakeKey] = useState(0)

  function onTransform(id: string, transform: ObjectTransform) {
    const { scene, planTransform } = useEditorStore.getState()
    const object = scene?.layers.flatMap((layer) => layer.objects).find((o) => o.id === id)
    if (!object) return
    const plan = planTransform(id, transform)
    setPreview({
      object: { ...object, ...plan.transform },
      collidesWith: plan.result.ok ? [] : plan.result.collidesWith,
    })
  }

  function onTransformEnd(id: string, transform: ObjectTransform) {
    setPreview(null)
    const result = useEditorStore.getState().transformObject(id, transform)
    if (!result.ok) {
      toast.error('errors.collision')
      setShakeKey((key) => key + 1)
    }
  }

  return { preview, shakeKey, onTransform, onTransformEnd }
}
