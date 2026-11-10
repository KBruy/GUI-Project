import { Link } from 'react-router'
import { useT } from '@/i18n/language'
import { Container, Stack } from '@/shared/components/layout/Layout'

// Każdy adres spoza router.tsx (trasa '*').
export default function NotFoundPage() {
  const { t } = useT()

  return (
    <Container>
      <Stack gap={3}>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.text')}</p>
        <Link to="/">{t('notFound.back')}</Link>
      </Stack>
    </Container>
  )
}
