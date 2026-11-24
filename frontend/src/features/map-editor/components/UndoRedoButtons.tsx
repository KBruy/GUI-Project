// Przyciski „Cofnij” i „Ponów” w pasku narzędzi (to samo co Ctrl+Z i Ctrl+Shift+Z).
// Są wyszarzone, gdy w historii silnika nie ma czego cofnąć albo ponowić.
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'

export function UndoRedoButtons() {
  const { t } = useT()
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)

  return (
    <>
      <Button size="sm" variant="secondary" disabled={!canUndo} onClick={undo}>
        {t('editor.undo')}
      </Button>
      <Button size="sm" variant="secondary" disabled={!canRedo} onClick={redo}>
        {t('editor.redo')}
      </Button>
    </>
  )
}
