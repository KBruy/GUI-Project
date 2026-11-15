// Przełączniki siatki w pasku narzędzi edytora (F-27).
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'

export function GridToggles() {
  const { t } = useT()
  const gridVisible = useEditorStore((s) => s.gridVisible)
  const gridSnap = useEditorStore((s) => s.gridSnap)
  const setGridVisible = useEditorStore((s) => s.setGridVisible)
  const setGridSnap = useEditorStore((s) => s.setGridSnap)

  return (
    <>
      <Button
        size="sm"
        icon="Grid"
        pressed={gridVisible}
        onClick={() => setGridVisible(!gridVisible)}
      >
        {t('editor.grid')}
      </Button>
      {/* Przyciąganie działa przy dodawaniu (F-31) i przeciąganiu (F-33) obiektów. */}
      <Button size="sm" pressed={gridSnap} onClick={() => setGridSnap(!gridSnap)}>
        {t('editor.snap')}
      </Button>
    </>
  )
}
