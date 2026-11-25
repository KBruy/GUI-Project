// Panel „Warstwy” (F-35): lista od najwyższej warstwy, kliknięcie w nazwę wybiera aktywną
// (na nią trafiają nowe obiekty). Każda akcja to jeden krok cofania (akcje warstw w editorStore).
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { IconButton } from '@/shared/components/ui/IconButton/IconButton'
import { Tooltip } from '@/shared/components/ui/Tooltip/Tooltip'
import { MAX_LAYERS } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import styles from './LayersPanel.module.css'

export function LayersPanel() {
  const { t } = useT()
  const layers = useEditorStore((s) => s.scene?.layers)
  const activeLayerId = useEditorStore((s) => s.activeLayerId)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer)
  const addLayer = useEditorStore((s) => s.addLayer)
  const moveLayer = useEditorStore((s) => s.moveLayer)
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const highlight = useEditorStore((s) => s.highlightActiveLayer)
  const setHighlight = useEditorStore((s) => s.setHighlightActiveLayer)
  const hoveredLayerId = useEditorStore((s) => s.hoveredLayerId)
  const setHoveredLayer = useEditorStore((s) => s.setHoveredLayer)

  if (!layers) return null
  const full = layers.length >= MAX_LAYERS

  const addButton = (
    <Button
      size="sm"
      disabled={full}
      onClick={() => addLayer(`${t('layers.defaultName')} ${layers.length + 1}`)}
    >
      {t('layers.add')}
    </Button>
  )

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {/* W scenie warstwy idą od najniższej, a panel pokazuje najwyższą na górze. */}
        {layers
          .map((layer, index) => ({ layer, index }))
          .reverse()
          .map(({ layer, index }) => {
            const active = layer.id === activeLayerId
            // Zaznaczone obiekty z tej warstwy: wiersz jest podświetlony, a licznik pokazuje „2/5”.
            const selected = layer.objects.filter((o) => selectedIds.includes(o.id)).length
            return (
              <li
                key={layer.id}
                className={[
                  styles.row,
                  active && styles.active,
                  selected > 0 && styles.hasSelection,
                  layer.id === hoveredLayerId && styles.hovered,
                  !layer.visible && styles.hidden,
                ]
                  .filter(Boolean)
                  .join(' ')}
                // Najechanie na wiersz obrysowuje obiekty warstwy na mapie.
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
              >
                <button
                  type="button"
                  className={styles.name}
                  aria-current={active}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  {layer.name}
                </button>
                {/* Liczba obiektów na warstwie (przy zaznaczeniu: zaznaczone/wszystkie),
                    pełny opis w dymku przeglądarki. */}
                <span
                  className={styles.count}
                  title={t(selected > 0 ? 'layers.selectedObjects' : 'layers.objects')}
                >
                  {selected > 0 ? `${selected}/${layer.objects.length}` : layer.objects.length}
                </span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={layer.visible ? 'Eye' : 'EyeClosed'}
                  label={t(layer.visible ? 'layers.hide' : 'layers.show')}
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                />
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={layer.locked ? 'Lock' : 'LockOpen'}
                  label={t(layer.locked ? 'layers.unlock' : 'layers.lock')}
                  onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                />
                {/* Zablokowanej warstwy silnik nie przesuwa, więc strzałki są wtedy wyłączone.
                    Wyłączona strzałka jest niewidoczna, ale zajmuje miejsce, żeby wiersze się nie rozjeżdżały. */}
                <IconButton
                  size="sm"
                  variant="ghost"
                  className={styles.arrow}
                  icon="ArrowUp"
                  label={t('layers.up')}
                  disabled={layer.locked || index === layers.length - 1}
                  onClick={() => moveLayer(layer.id, index + 1)}
                />
                <IconButton
                  size="sm"
                  variant="ghost"
                  className={styles.arrow}
                  icon="ArrowDown"
                  label={t('layers.down')}
                  disabled={layer.locked || index === 0}
                  onClick={() => moveLayer(layer.id, index - 1)}
                />
              </li>
            )
          })}
      </ul>
      <div className={styles.actions}>
        {full ? <Tooltip text={t('errors.layerLimit')}>{addButton}</Tooltip> : addButton}
        {/* Przygasza pozostałe warstwy: widać, z czym obiekt może kolidować. */}
        <Button size="sm" pressed={highlight} onClick={() => setHighlight(!highlight)}>
          {t('layers.highlight')}
        </Button>
      </div>
    </div>
  )
}
