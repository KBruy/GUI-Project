// Przycisk „Zapisz” w pasku narzędzi (F-38). Gwiazdka i czerwony kolor: są niezapisane zmiany.
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { saveProject } from '../saveProject'
import { hasUnsavedChanges, useEditorStore } from '../store/editorStore'

export function SaveButton() {
  const { t } = useT()
  const hasScene = useEditorStore((s) => s.scene !== null)
  const saving = useEditorStore((s) => s.saving)
  const unsaved = useEditorStore(hasUnsavedChanges)

  return (
    <Button
      size="sm"
      variant={unsaved ? 'primary' : 'secondary'}
      disabled={!hasScene || saving}
      title={unsaved ? t('editor.unsaved') : undefined}
      onClick={saveProject}
    >
      {t('editor.save')}
      {/* Czytnik ekranu nie czyta gwiazdki, tylko nazwę przycisku. */}
      {unsaved && <span aria-hidden="true"> *</span>}
    </Button>
  )
}
