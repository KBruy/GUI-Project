import { useT } from '@/i18n/language'
import { MapCanvas } from '@/features/map-editor/components/MapCanvas'
import { Container } from '@/shared/components/layout/Layout'

// Na razie tytuł i sam canvas; pełny układ: Edytor map (F-29).
export default function MapEditorPage() {
  const { t } = useT()

  return (
    <Container>
      <h1>{t('nav.editor')}</h1>
      <MapCanvas />
    </Container>
  )
}
