import { useT } from '@/i18n/language'
import { useTheme } from '@/shared/theme/theme'
import { THEMES } from '@/shared/theme/theme'

function App() {
  const { t, language, setLanguage } = useT()
  const { theme, setTheme } = useTheme()

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(next)
  }

  return (
    <>
      <h1>{t('app.title')}</h1>
      {/* TODO F-22: zastąpić ThemeSwitcher/LanguageSwitcher */}
      <button onClick={cycleTheme}>{t('theme.label')}: {theme}</button>
      <button onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}>
        {t('lang.label')}: {language}
      </button>
    </>
  )
}

export default App
