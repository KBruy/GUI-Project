// Paleta assetów mapy (F-31): zakładki kategorii i kafelki z miniaturami.
// Kliknięcie kafelka stawia obiekt na środku widoku, na aktywnej warstwie.
// Kafelek można też przeciągnąć na mapę: upuszczenie obsługuje MapCanvas.
import { useEffect, useState } from 'react'
import { dictionary, type TranslationKey } from '@/i18n/dictionary'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { OptionTile } from '@/shared/components/ui/OptionTile/OptionTile'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'
import { toast } from '@/shared/components/ui/Toast/toast'
import { assetUrl, type Asset } from '@/shared/lib/assets'
import { useEditorStore } from '../store/editorStore'
import styles from './AssetPalette.module.css'

// Typ danych przy przeciąganiu kafelka; w środku jest id assetu.
export const ASSET_DRAG_TYPE = 'application/x-worldsmith-asset'

export function AssetPalette() {
  const { t } = useT()
  const assets = useEditorStore((s) => s.assets)
  const error = useEditorStore((s) => s.assetsError)
  const status = useEditorStore((s) => s.assetsStatus)
  const hasScene = useEditorStore((s) => s.scene !== null)
  const loadAssets = useEditorStore((s) => s.loadAssets)
  const addAsset = useEditorStore((s) => s.addAsset)
  const [picked, setPicked] = useState<string | null>(null)

  // Nazwy z manifestu to klucze słownika. Brak klucza (np. nowa grafika Moniki) → zapasowy tekst.
  const translate = (key: string, fallback: string) =>
    Object.hasOwn(dictionary, key) ? t(key as TranslationKey) : fallback

  // Biblioteka zostaje w store, więc po powrocie na stronę nie pobieramy jej drugi raz.
  useEffect(() => {
    if (useEditorStore.getState().assetsStatus === 'idle') loadAssets()
  }, [loadAssets])

  function add(asset: Asset) {
    const result = addAsset(asset)
    if (!result.ok) toast.error('errors.collision')
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
                label={name}
                tooltip={`${name} · ${asset.width}×${asset.height}`}
                imageUrl={assetUrl(asset.file)}
                disabled={!hasScene}
                onClick={() => add(asset)}
                draggable={hasScene}
                onDragStart={(e) => {
                  e.dataTransfer.setData(ASSET_DRAG_TYPE, asset.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
              />
            )
          })}
      </div>
    </div>
  )
}
