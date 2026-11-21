// Przycisk „Usuń” w pasku narzędzi: usuwa zaznaczone obiekty (to samo co Delete i Backspace).
// Docelowo przejdzie do panelu właściwości (F-36).
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'

export function DeleteButton() {
  const { t } = useT()
  const hasSelection = useEditorStore((s) => s.selectedIds.length > 0)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)

  return (
    <Button size="sm" variant="secondary" disabled={!hasSelection} onClick={deleteSelected}>
      {t('editor.delete')}
    </Button>
  )
}
