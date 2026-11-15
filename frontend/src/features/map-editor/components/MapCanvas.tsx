// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect, useMemo, type DragEvent } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { toast } from '@/shared/components/ui/Toast/toast'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { assetUrl } from '@/shared/lib/assets'
import { useEditorStore } from '../store/editorStore'
import { useViewControls } from '../useViewControls'
import { toScenePoint } from '../view'
import { ASSET_DRAG_TYPE } from './AssetPalette'
import styles from './MapCanvas.module.css'

export function MapCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const zoom = useEditorStore((s) => s.zoom)
  const offset = useEditorStore((s) => s.offset)
  const setViewport = useEditorStore((s) => s.setViewport)
  const assets = useEditorStore((s) => s.assets)
  const addAsset = useEditorStore((s) => s.addAsset)
  // assetId → adres PNG. Obiekt, którego assetu nie ma w bibliotece, rysuje się jako czerwony prostokąt.
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, assetUrl(a.file)])), [assets])
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const { cursor, handlers } = useViewControls(ref)

  // Store potrzebuje rozmiaru canvasu do zoomu w środku i „Dopasuj do ekranu”.
  useEffect(() => {
    if (width > 0 && height > 0) setViewport({ width, height })
  }, [width, height, setViewport])

  // Bez preventDefault przeglądarka nie pozwoli upuścić kafelka z palety.
  function onDragOver(e: DragEvent) {
    if (scene && e.dataTransfer.types.includes(ASSET_DRAG_TYPE)) e.preventDefault()
  }

  // Obiekt staje tam, gdzie puszczono kursor (środek obiektu pod kursorem, potem przyciąganie).
  function onDrop(e: DragEvent) {
    const asset = assets.find((a) => a.id === e.dataTransfer.getData(ASSET_DRAG_TYPE))
    if (!asset || !ref.current) return
    e.preventDefault()
    const rect = ref.current.getBoundingClientRect()
    const point = toScenePoint(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { zoom, offset }
    )
    if (!addAsset(asset, point).ok) toast.error('errors.collision')
  }

  return (
    <div
      ref={ref}
      className={styles.canvas}
      style={{ cursor }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      {...handlers}
    >
      {/* Przed pierwszym pomiarem rozmiar to 0, a Konva nie przyjmuje pustego canvasu. */}
      {scene && width > 0 && height > 0 && (
        <SceneRenderer
          scene={scene}
          width={width}
          height={height}
          zoom={zoom}
          offset={offset}
          getAssetUrl={(id) => urls.get(id)}
        >
          {gridVisible && (
            <GridLayer width={scene.width} height={scene.height} size={scene.gridSize} />
          )}
        </SceneRenderer>
      )}
    </div>
  )
}
