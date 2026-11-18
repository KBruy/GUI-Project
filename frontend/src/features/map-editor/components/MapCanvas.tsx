// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { demoScene } from '../demoScene'
import { useEditorStore } from '../store/editorStore'
import { useViewControls } from '../useViewControls'
import styles from './MapCanvas.module.css'

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const loadScene = useEditorStore((s) => s.loadScene)
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const zoom = useEditorStore((s) => s.zoom)
  const offset = useEditorStore((s) => s.offset)
  const setViewport = useEditorStore((s) => s.setViewport)
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const { cursor, handlers } = useViewControls(ref)

  // Do czasu okna „Nowa mapa” (F-30) bez sceny pokazujemy scenę demo.
  useEffect(() => {
    if (!scene) loadScene(demoScene)
  }, [scene, loadScene])

  // Store potrzebuje rozmiaru canvasu do zoomu w środku i „Dopasuj do ekranu”.
  useEffect(() => {
    if (width > 0 && height > 0) setViewport({ width, height })
  }, [width, height, setViewport])

  return (
    <div ref={ref} className={styles.canvas} style={{ cursor }} {...handlers}>
      {/* Przed pierwszym pomiarem rozmiar to 0, a Konva nie przyjmuje pustego canvasu. */}
      {scene && width > 0 && height > 0 && (
        <SceneRenderer scene={scene} width={width} height={height} zoom={zoom} offset={offset}>
          {gridVisible && (
            <GridLayer width={scene.width} height={scene.height} size={scene.gridSize} />
          )}
        </SceneRenderer>
      )}
    </div>
  )
}
