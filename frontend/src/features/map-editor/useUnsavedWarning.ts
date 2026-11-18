// Ostrzeżenie przeglądarki przy zamykaniu albo odświeżaniu karty z niezapisaną mapą.
// Przejście na inną podstronę aplikacji niczego nie gubi (scena zostaje w store),
// dlatego hook działa w AppLayout, a nie tylko na stronie edytora.
import { useEffect } from 'react'
import { hasUnsavedChanges, useEditorStore } from './store/editorStore'

export function useUnsavedWarning() {
  const unsaved = useEditorStore(hasUnsavedChanges)

  useEffect(() => {
    if (!unsaved) return
    function onBeforeUnload(event: BeforeUnloadEvent) {
      // Tekstu okna nie da się ustawić: przeglądarka pokazuje własny komunikat.
      event.preventDefault()
      // Starsze przeglądarki (np. Safari) pokazują okno dopiero z ustawionym returnValue.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [unsaved])
}
