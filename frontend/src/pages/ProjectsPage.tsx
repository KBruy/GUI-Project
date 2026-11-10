import { useT } from '@/i18n/language'
import { Container } from '@/shared/components/layout/Layout'

// Na razie pusta podstrona; treść: Lista projektów (F-39).
export default function ProjectsPage() {
  const { t } = useT()

  return (
    <Container>
      <h1>{t('nav.projects')}</h1>
    </Container>
  )
}
