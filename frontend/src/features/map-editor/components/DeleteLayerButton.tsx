// Usuwa aktywną warstwę (panel warstw, F-35). Gdy warstwa ma obiekty, najpierw pyta w oknie,
// bo znikają razem z nią. Pustą usuwa od razu. Jedno i drugie da się cofnąć Ctrl+Z.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { IconButton } from '@/shared/components/ui/IconButton/IconButton'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { useEditorStore } from '../store/editorStore'

export function DeleteLayerButton() {
  const { t } = useT()
  const layers = useEditorStore((s) => s.scene?.layers)
  const activeLayerId = useEditorStore((s) => s.activeLayerId)
  const removeLayer = useEditorStore((s) => s.removeLayer)
  const [confirming, setConfirming] = useState(false)

  const layer = layers?.find((l) => l.id === activeLayerId)
  if (!layers || !layer) return null

  function remove() {
    setConfirming(false)
    removeLayer(layer!.id)
  }

  return (
    <>
      {/* Ostatniej i zablokowanej warstwy silnik nie usuwa. */}
      <IconButton
        size="sm"
        icon="Trash"
        label={t('layers.delete')}
        disabled={layers.length === 1 || layer.locked}
        onClick={() => (layer.objects.length > 0 ? setConfirming(true) : remove())}
      />
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('layers.deleteTitle')}
        closeLabel={t('actions.close')}
        actions={
          <>
            <Button onClick={() => setConfirming(false)}>{t('actions.cancel')}</Button>
            <Button variant="danger" onClick={remove}>
              {t('layers.delete')}
            </Button>
          </>
        }
      >
        <p>
          {layer.name} · {t('layers.objects')}: {layer.objects.length}
        </p>
        <p>{t('layers.deleteText')}</p>
      </Modal>
    </>
  )
}
