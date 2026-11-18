// Okno „Nowa mapa” (F-30): nazwa i rozmiar, a „Utwórz” wczytuje pustą scenę z jedną warstwą.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import type { TranslationKey } from '@/i18n/dictionary'
import { Stack } from '@/shared/components/layout/Layout'
import { Button } from '@/shared/components/ui/Button/Button'
import { Input } from '@/shared/components/ui/Input/Input'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { OptionTile } from '@/shared/components/ui/OptionTile/OptionTile'
import { createMapScene, GRID_SIZE, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'

// Etykiety w kolejności MAP_SIZES z silnika (mała, średnia, duża).
const SIZE_LABELS: TranslationKey[] = ['newMap.small', 'newMap.medium', 'newMap.large']

interface NewMapModalProps {
  open: boolean
  onClose: () => void
}

export function NewMapModal({ open, onClose }: NewMapModalProps) {
  const { t } = useT()
  const loadScene = useEditorStore((s) => s.loadScene)
  const [name, setName] = useState(() => t('newMap.defaultName'))
  const [sizeIndex, setSizeIndex] = useState(0)

  // Backend też odrzuca nazwę z samych spacji (NAME_REQUIRED).
  const nameMissing = name.trim() === ''

  function create() {
    loadScene(createMapScene(name.trim(), MAP_SIZES[sizeIndex], t('newMap.layer')))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('newMap.title')}
      closeLabel={t('actions.close')}
      actions={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button variant="primary" disabled={nameMissing} onClick={create}>
            {t('newMap.create')}
          </Button>
        </>
      }
    >
      <Stack gap={4}>
        <Input
          label={t('newMap.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameMissing ? t('newMap.nameRequired') : undefined}
        />
        <Stack direction="row" gap={3} role="group" aria-label={t('newMap.size')}>
          {MAP_SIZES.map((size, index) => (
            <OptionTile
              key={size.width}
              label={t(SIZE_LABELS[index])}
              selected={index === sizeIndex}
              onClick={() => setSizeIndex(index)}
            >
              {/* Rozmiar w polach siatki, np. 20×15. */}
              {size.width / GRID_SIZE}×{size.height / GRID_SIZE}
            </OptionTile>
          ))}
        </Stack>
      </Stack>
    </Modal>
  )
}
