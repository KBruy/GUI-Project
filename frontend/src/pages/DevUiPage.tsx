// Strona dostępna tylko w trybie dev pod /dev/ui — nie linkujemy jej z nawigacji aplikacji.
// Każdy task dopisuje tu sekcję ze swoimi komponentami we wszystkich wariantach.
import { useT } from '@/i18n/language'
import { useTheme, THEMES } from '@/shared/theme/theme'

export default function DevUiPage() {
  const { t, language, setLanguage } = useT()
  const { theme, setTheme } = useTheme()

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(next)
  }

  return (
    <main>
      <h1>{t('dev.ui.title')}</h1>
      {/* TODO F-48: zastąpić SegmentedControl */}
      <button onClick={cycleTheme}>
        {t('theme.label')}: {theme}
      </button>
      <button onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}>
        {t('lang.label')}: {language}
      </button>
    </main>
  )
}
