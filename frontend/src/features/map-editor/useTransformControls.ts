// Obracanie i skalowanie zaznaczonego obiektu uchwytami (F-34). Podgląd w trakcie pokazuje
// obiekt po zaokrągleniach ze store'u, a koniec zapisuje zmianę jednym krokiem cofania.
// Przy kolizji obiekt wraca na stare miejsce (execute niczego wtedy nie zmienia).
import { useState } from 'react'
import type { ObjectTransform } from '@/shared/canvas/SelectionTransformer'
import type { SceneObject } from './engine/engine'
import { useEditorStore } from './store/editorStore'

export function useTransformControls() {
  // Obiekt w trakcie obracania albo skalowania, z wartościami gotowymi do zapisu.
  const [preview, setPreview] = useState<SceneObject | null>(null)

  function objectById(id: string) {
    return useEditorStore
      .getState()
      .scene?.layers.flatMap((layer) => layer.objects)
      .find((o) => o.id === id)
  }

  function onTransform(id: string, transform: ObjectTransform) {
    const object = objectById(id)
    if (!object) return
    const plan = useEditorStore.getState().planTransform(id, transform)
    setPreview({ ...object, ...plan.transform })
  }

  function onTransformEnd(id: string, transform: ObjectTransform) {
    setPreview(null)
    useEditorStore.getState().transformObject(id, transform)
  }

  return { preview, onTransform, onTransformEnd }
}
