// Canvas edytora map: rysuje scenę ze store'u i wypełnia całe miejsce, które dostanie od rodzica.
import { useEffect, useMemo, type DragEvent } from 'react'
import { GridLayer } from '@/shared/canvas/GridLayer'
import { SceneRenderer } from '@/shared/canvas/SceneRenderer'
import { SelectionLayer } from '@/shared/canvas/SelectionLayer'
import { toast } from '@/shared/components/ui/Toast/toast'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { assetUrl } from '@/shared/lib/assets'
import { useEditorStore } from '../store/editorStore'
import { useSelectionControls } from '../useSelectionControls'
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
  const selectedIds = useEditorStore((s) => s.selectedIds)
  // assetId → adres PNG. Obiekt, którego assetu nie ma w bibliotece, rysuje się jako czerwony prostokąt.
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, assetUrl(a.file)])), [assets])
  // Obiekty do ramek zaznaczenia. Zaznaczenie z ukrytej warstwy się nie rysuje.
  const selected = useMemo(
    () =>
      (scene?.layers ?? [])
        .filter((layer) => layer.visible)
        .flatMap((layer) => layer.objects)
        .filter((object) => selectedIds.includes(object.id)),
    [scene, selectedIds]
  )
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const view = useViewControls(ref)
  const selection = useSelectionControls(ref)

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
      style={{ cursor: view.cursor }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      // Najpierw widok: gdy zacznie przesuwanie, zaznaczanie to pomija (defaultPrevented).
      onPointerDown={(e) => {
        view.handlers.onPointerDown(e)
        selection.handlers.onPointerDown(e)
      }}
      onPointerMove={(e) => {
        view.handlers.onPointerMove(e)
        selection.handlers.onPointerMove(e)
      }}
      onPointerUp={() => {
        view.handlers.onPointerUp()
        selection.handlers.onPointerUp()
      }}
      onPointerCancel={() => {
        view.handlers.onPointerCancel()
        selection.handlers.onPointerCancel()
      }}
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
          <SelectionLayer objects={selected} marquee={selection.marquee} />
        </SceneRenderer>
      )}
    </div>
  )
}
