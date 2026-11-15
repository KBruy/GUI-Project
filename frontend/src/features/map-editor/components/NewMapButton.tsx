// Przycisk „Nowa mapa” w pasku narzędzi i jego okno (F-30).
// Bez wczytanej sceny okno otwiera się samo, od razu po wejściu na /map.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'
import { NewMapModal } from './NewMapModal'

export function NewMapButton() {
  const { t } = useT()
  const hasScene = useEditorStore((s) => s.scene !== null)
  const [open, setOpen] = useState(!hasScene)

  return (
    <>
      <Button size="sm" icon="Edit" onClick={() => setOpen(true)}>
        {t('newMap.open')}
      </Button>
      <NewMapModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
