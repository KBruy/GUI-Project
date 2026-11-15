import { useT } from '@/i18n/language'
import { Container } from '@/shared/components/layout/Layout'

// Na razie pusta podstrona; treść: Strona startowa.
export default function HomePage() {
  const { t } = useT()

  return (
    <Container>
      <h1>{t('app.title')}</h1>
    </Container>
  )
}
