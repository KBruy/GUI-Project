// Canvas edytora map: rysuje scenę ze store'u.
// Na razie ma rozmiar sceny. Wypełnianie wolnego miejsca dojdzie z układem strony (F-29).
import { useEffect } from 'react'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { demoScene } from '../demoScene'
import { useEditorStore } from '../store/editorStore'

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const loadScene = useEditorStore((s) => s.loadScene)

  // Do czasu okna „Nowa mapa” (F-30) bez sceny pokazujemy scenę demo.
  useEffect(() => {
    if (!scene) loadScene(demoScene)
  }, [scene, loadScene])

  if (!scene) return null
  return <SceneRenderer scene={scene} width={scene.width} height={scene.height} />
}
