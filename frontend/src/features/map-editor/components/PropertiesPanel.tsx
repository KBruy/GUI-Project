// Panel „Właściwości” (F-36): co jest zaznaczone na mapie. Jeden obiekt: grafika, warstwa,
// położenie (środek, jak w etykiecie przy przeciąganiu), rozmiar w px sceny, skala i obrót.
// Kilka obiektów: ich liczba.
import { dictionary, type TranslationKey } from '@/i18n/dictionary'
import { useT } from '@/i18n/language'
import { Stack } from '@/shared/components/layout/Layout'
import { Input } from '@/shared/components/ui/Input/Input'
import { useEditorStore } from '../store/editorStore'
import styles from './PropertiesPanel.module.css'

// Do dwóch miejsc po przecinku, bez zbędnych zer (1.5, nie 1.50).
const format = (value: number) => String(Math.round(value * 100) / 100)

export function PropertiesPanel() {
  const { t } = useT()
  const scene = useEditorStore((s) => s.scene)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const assets = useEditorStore((s) => s.assets)

  if (!scene || selectedIds.length === 0) {
    return <p className={styles.message}>{t('properties.empty')}</p>
  }
  if (selectedIds.length > 1) {
    return <p>{`${t('properties.selected')}: ${selectedIds.length}`}</p>
  }

  const layer = scene.layers.find((l) => l.objects.some((o) => o.id === selectedIds[0]))
  const object = layer?.objects.find((o) => o.id === selectedIds[0])
  if (!layer || !object) return null
  // Nazwa z manifestu to klucz słownika. Brak klucza albo assetu → id assetu.
  const nameKey = assets.find((a) => a.id === object.assetId)?.nameKey ?? ''
  const name = Object.hasOwn(dictionary, nameKey) ? t(nameKey as TranslationKey) : object.assetId

  const field = (label: TranslationKey, value: number) => (
    <Input label={t(label)} type="number" value={format(value)} readOnly />
  )

  return (
    <Stack gap={3}>
      <p>{`${t('properties.asset')}: ${name}`}</p>
      <p>{`${t('properties.layer')}: ${layer.name}`}</p>
      <div className={styles.pairs}>
        {field('properties.x', object.x)}
        {field('properties.y', object.y)}
        {field('properties.width', object.width * object.scaleX)}
        {field('properties.height', object.height * object.scaleY)}
        {field('properties.scaleX', object.scaleX)}
        {field('properties.scaleY', object.scaleY)}
        {field('properties.rotation', object.rotation)}
      </div>
    </Stack>
  )
}
