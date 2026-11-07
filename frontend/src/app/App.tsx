import { useT } from '@/i18n/language'
import DevUiPage from '@/pages/DevUiPage'
import { AppFooter } from './AppFooter'

// Brak routera (F-21) — pathname sprawdzamy bezpośrednio; po dodaniu React Router zastąpić trasą.
function App() {
  const { t } = useT()

  // TODO F-21: zastąpić trasą routera, a AppFooter przenieść do AppLayout
  const page = window.location.pathname === '/dev/ui' ? <DevUiPage /> : <h1>{t('app.title')}</h1>

  return (
    <>
      {page}
      <AppFooter />
    </>
  )
}

export default App
