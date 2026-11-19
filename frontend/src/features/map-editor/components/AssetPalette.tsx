// Paleta assetów mapy (F-31): zakładki kategorii i kafelki z miniaturami.
// Kliknięcie kafelka wybiera asset, którym malują narzędzia z panelu „Narzędzia” (ToolPanel).
// Przy zaznaczaniu kliknięcie od razu włącza pędzel. Esc wraca do zaznaczania.
// Kafelek można też przeciągnąć na mapę. Nie używamy systemowego przeciągania (drag and drop),
// tylko zdarzeń wskaźnika: paleta ustawia placingAsset w store, a podgląd i upuszczenie
// obsługuje MapCanvas, tak samo jak przy przeciąganiu obiektów po mapie.
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { dictionary, type TranslationKey } from '@/i18n/dictionary'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { OptionTile } from '@/shared/components/ui/OptionTile/OptionTile'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'
import { assetUrl, type Asset } from '@/shared/lib/assets'
import { useEditorStore } from '../store/editorStore'
import styles from './AssetPalette.module.css'

// Od tylu pikseli ruchu wciśnięty kafelek zaczyna się przeciągać (krótszy ruch to kliknięcie).
const DRAG_THRESHOLD = 3

export function AssetPalette() {
  const { t } = useT()
  const assets = useEditorStore((s) => s.assets)
  const error = useEditorStore((s) => s.assetsError)
  const status = useEditorStore((s) => s.assetsStatus)
  const hasScene = useEditorStore((s) => s.scene !== null)
  const loadAssets = useEditorStore((s) => s.loadAssets)
  const brush = useEditorStore((s) => s.brush)
  const setBrush = useEditorStore((s) => s.setBrush)
  const painting = useEditorStore((s) => s.tool !== 'select')
  const setTool = useEditorStore((s) => s.setTool)
  const setPlacingAsset = useEditorStore((s) => s.setPlacingAsset)
  const [picked, setPicked] = useState<string | null>(null)
  // Po przeciągnięciu przeglądarka może jeszcze wysłać click na kafelek: wtedy go pomijamy.
  const dragged = useRef(false)

  // Nazwy z manifestu to klucze słownika. Brak klucza (np. nowa grafika Moniki) → zapasowy tekst.
  const translate = (key: string, fallback: string) =>
    Object.hasOwn(dictionary, key) ? t(key as TranslationKey) : fallback

  // Biblioteka zostaje w store, więc po powrocie na stronę nie pobieramy jej drugi raz.
  useEffect(() => {
    if (useEditorStore.getState().assetsStatus === 'idle') loadAssets()
  }, [loadAssets])

  function pick(asset: Asset) {
    if (dragged.current) return
    setBrush(asset)
    if (!painting) setTool('brush')
  }

  function startDrag(event: PointerEvent, asset: Asset) {
    if (event.button !== 0 || !hasScene) return
    // Bez tego przeglądarka zaznacza tekst podczas przeciągania.
    event.preventDefault()
    dragged.current = false
    const start = { x: event.clientX, y: event.clientY }
    function onMove(move: globalThis.PointerEvent) {
      if (Math.hypot(move.clientX - start.x, move.clientY - start.y) < DRAG_THRESHOLD) return
      dragged.current = true
      setPlacingAsset(asset)
      stop()
    }
    function stop() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
  }

  if (status !== 'done') return <p className={styles.message}>{t('palette.loading')}</p>
  if (error && assets.length === 0) {
    return (
      <div className={styles.message}>
        <p>{t(error)}</p>
        <Button size="sm" onClick={loadAssets}>
          {t('palette.retry')}
        </Button>
      </div>
    )
  }
  if (assets.length === 0) return <p className={styles.message}>{t('palette.empty')}</p>

  // Kategorie w kolejności z manifestu (backend sortuje assety po kategorii).
  const categories = [...new Set(assets.map((a) => a.category))]
  const category = picked && categories.includes(picked) ? picked : categories[0]

  return (
    <div className={styles.palette}>
      <SegmentedControl
        size="sm"
        wrap
        label={t('palette.categories')}
        value={category}
        onChange={setPicked}
        options={categories.map((c) => ({
          value: c,
          label: translate(`categories.map.${c}`, c),
        }))}
      />
      <div className={styles.grid}>
        {assets
          .filter((a) => a.category === category)
          .map((asset) => {
            const name = translate(asset.nameKey, asset.id)
            return (
              <OptionTile
                key={asset.id}
                size="sm"
                className={styles.tile}
                label={name}
                tooltip={`${name} · ${asset.width}×${asset.height}`}
                imageUrl={assetUrl(asset.file)}
                selected={painting && brush?.id === asset.id}
                disabled={!hasScene}
                onClick={() => pick(asset)}
                onPointerDown={(e) => startDrag(e, asset)}
                // Obrazek w kafelku przeglądarka chce przeciągać po swojemu: blokujemy to.
                onDragStart={(e) => e.preventDefault()}
              />
            )
          })}
      </div>
    </div>
  )
}
