// Adres edytora i projekt w nim (F-38). /map to nowa, jeszcze niezapisana mapa,
// a /map/<id> to zapisany projekt, więc odświeżenie strony albo link wczytują go z backendu.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from '@/shared/components/ui/Toast/toast'
import { ApiError } from '@/shared/lib/apiClient'
import { useEditorStore } from './store/editorStore'

export function useProjectUrl(id: string | undefined) {
  const navigate = useNavigate()
  const projectId = useEditorStore((s) => s.projectId)
  const openingId = useEditorStore((s) => s.openingId)

  // Adres wskazuje inny projekt niż ten w edytorze (link, odświeżenie, lista projektów): wczytujemy go.
  useEffect(() => {
    const { projectId, openingId } = useEditorStore.getState()
    // openingId: już go wczytujemy (StrictMode w trybie dev uruchamia efekty dwa razy).
    if (!id || id === projectId || id === openingId) return
    useEditorStore
      .getState()
      .openProject(id)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.messageKey : 'errors.serverError')
      })
  }, [id])

  // Adres idzie za edytorem: po pierwszym zapisie /map → /map/<id>, po „Nowa mapa” z powrotem /map,
  // a po nieudanym wczytaniu na adres projektu, który został w edytorze.
  useEffect(() => {
    // Stan czytamy na świeżo, bo efekt wyżej mógł właśnie zacząć wczytywanie.
    if (useEditorStore.getState().openingId) return
    const target = projectId ? `/map/${projectId}` : '/map'
    if (target !== (id ? `/map/${id}` : '/map')) navigate(target, { replace: true })
  }, [id, projectId, openingId, navigate])
}
