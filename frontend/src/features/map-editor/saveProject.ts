// Zapis mapy z przycisku „Zapisz” i z Ctrl+S (F-38): wynik pokazuje toast.
import { toast } from '@/shared/components/ui/Toast/toast'
import { ApiError } from '@/shared/lib/apiClient'
import { useEditorStore } from './store/editorStore'

export async function saveProject() {
  const { scene, saving, save } = useEditorStore.getState()
  // Zapis już trwa (np. Ctrl+S trzymane dłużej): store i tak by go pominął, a nie chcemy drugiego toastu.
  if (!scene || saving) return
  try {
    await save()
    toast.success('project.saved')
  } catch (err) {
    // Np. errors.validationFailed albo errors.network. Zmiany zostają niezapisane, można spróbować znowu.
    toast.error(err instanceof ApiError ? err.messageKey : 'errors.serverError')
  }
}
