import { useT } from '@/i18n/language'
import { Container } from '@/shared/components/layout/Layout'

// Na razie pusta podstrona; treść: Edytor map (F-29).
export default function MapEditorPage() {
  const { t } = useT()

  return (
    <Container>
      <h1>{t('nav.editor')}</h1>
    </Container>
  )
}
