// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect } from 'react'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { demoScene } from '../demoScene'
import { useEditorStore } from '../store/editorStore'
import styles from './MapCanvas.module.css'

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const loadScene = useEditorStore((s) => s.loadScene)
  const { ref, width, height } = useElementSize<HTMLDivElement>()

  // Do czasu okna „Nowa mapa” (F-30) bez sceny pokazujemy scenę demo.
  useEffect(() => {
    if (!scene) loadScene(demoScene)
  }, [scene, loadScene])

  return (
    <div ref={ref} className={styles.canvas}>
      {/* Przed pierwszym pomiarem rozmiar to 0, a Konva nie przyjmuje pustego canvasu. */}
      {scene && width > 0 && height > 0 && (
        <SceneRenderer scene={scene} width={width} height={height} />
      )}
    </div>
  )
}
