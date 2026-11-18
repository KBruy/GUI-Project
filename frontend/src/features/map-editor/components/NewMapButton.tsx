// Przycisk „Nowa mapa” w pasku narzędzi i jego okno (F-30).
// Bez wczytanej sceny okno otwiera się samo, od razu po wejściu na /map (ale nie pod /map/<id>).
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'
import { NewMapModal } from './NewMapModal'

interface NewMapButtonProps {
  // false: nie otwieraj okna samemu, bo właśnie wczytujemy zapisany projekt (F-38).
  autoOpen?: boolean
}

export function NewMapButton({ autoOpen = true }: NewMapButtonProps) {
  const { t } = useT()
  const hasScene = useEditorStore((s) => s.scene !== null)
  const opening = useEditorStore((s) => s.openingId !== null)
  const [clicked, setClicked] = useState(false)
  const [closed, setClosed] = useState(false)
  // Bez sceny okno otwiera się samo, także po nieudanym wczytaniu projektu
  // (adres wraca wtedy na /map), chyba że użytkownik już je zamknął.
  const open = clicked || (autoOpen && !hasScene && !opening && !closed)

  return (
    <>
      <Button size="sm" icon="Edit" onClick={() => setClicked(true)}>
        {t('newMap.open')}
      </Button>
      <NewMapModal
        open={open}
        onClose={() => {
          setClicked(false)
          setClosed(true)
        }}
      />
    </>
  )
}
