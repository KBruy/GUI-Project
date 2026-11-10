import { useT } from '@/i18n/language'
import { Container } from '@/shared/components/layout/Layout'

// Na razie pusta podstrona; treść: Kreator postaci (F-42).
export default function CharacterCreatorPage() {
  const { t } = useT()

  return (
    <Container>
      <h1>{t('nav.characters')}</h1>
    </Container>
  )
}
