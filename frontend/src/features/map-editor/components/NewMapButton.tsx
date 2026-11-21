// Przycisk „Nowa mapa” w pasku narzędzi i jego okno (F-30).
// Bez wczytanej sceny okno otwiera się samo, od razu po wejściu na /map (ale nie pod /map/<id>).
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'
import { NewMapModal } from './NewMapModal'

// Po nieudanym wczytaniu projektu okno czeka chwilę, żeby było widać komunikat o błędzie
// (tło okna przykryłoby toast).
export const OPEN_AFTER_ERROR_MS = 2000

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
  // Wejście pod /map/<id>: okno samo otworzy się dopiero, gdy wczytanie się nie uda
  // (adres wraca wtedy na /map) i minie OPEN_AFTER_ERROR_MS.
  const [waiting, setWaiting] = useState(!autoOpen)
  useEffect(() => {
    if (!autoOpen || !waiting) return
    const timer = window.setTimeout(() => setWaiting(false), OPEN_AFTER_ERROR_MS)
    return () => window.clearTimeout(timer)
  }, [autoOpen, waiting])
  // Bez sceny okno otwiera się samo, chyba że użytkownik już je zamknął.
  const open = clicked || (autoOpen && !waiting && !hasScene && !opening && !closed)

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
