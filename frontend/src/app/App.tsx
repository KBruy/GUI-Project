import { useT } from '@/i18n/language'
import DevUiPage from '@/pages/DevUiPage'

// Brak routera (F-21) — pathname sprawdzamy bezpośrednio; po dodaniu React Router zastąpić trasą.
function App() {
  const { t } = useT()

  if (window.location.pathname === '/dev/ui') {
    return <DevUiPage />
  }

  // TODO F-21: zastąpić trasą routera
  return <h1>{t('app.title')}</h1>
}

export default App
