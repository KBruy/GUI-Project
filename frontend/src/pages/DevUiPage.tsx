// Strona dostępna tylko w trybie dev pod /dev/ui — nie linkujemy jej z nawigacji aplikacji.
// Każdy task dopisuje tu sekcję ze swoimi komponentami we wszystkich wariantach.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { useTheme, THEMES } from '@/shared/theme/theme'
import { Button } from '@/shared/components/ui/Button/Button'
import type { ButtonVariant, ButtonSize } from '@/shared/components/ui/Button/Button'
import { IconButton } from '@/shared/components/ui/IconButton/IconButton'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

export default function DevUiPage() {
  const { t, language, setLanguage } = useT()
  const { theme, setTheme } = useTheme()
  const [pressed, setPressed] = useState(false)

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

      <section>
        <h2>Button / IconButton</h2>

        <p>Warianty × rozmiary</p>
        {VARIANTS.map((variant) => (
          <div key={variant}>
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {variant} {size}
              </Button>
            ))}
          </div>
        ))}

        <p>Z ikoną</p>
        <Button icon="Pencil">Edytuj</Button>
        <Button icon="Trash" variant="danger">Usuń</Button>
        <Button icon="Download" variant="primary" size="lg">Pobierz</Button>

        <p>Disabled</p>
        <Button disabled>secondary disabled</Button>
        <Button variant="primary" disabled>primary disabled</Button>
        <Button variant="ghost" disabled>ghost disabled</Button>

        <p>Pressed (toggle — kliknij, żeby przełączyć)</p>
        <Button pressed={pressed} onClick={() => setPressed((p) => !p)}>
          {pressed ? 'Wciśnięty' : 'Normalny'}
        </Button>

        <p>IconButton</p>
        <IconButton icon="Pencil" label="Edytuj" />
        <IconButton icon="Pencil" label="Edytuj (sm)" size="sm" />
        <IconButton icon="Pencil" label="Edytuj (lg)" size="lg" />
        <IconButton icon="Grid" label="Siatka" pressed={pressed} onClick={() => setPressed((p) => !p)} />
        <IconButton icon="Trash" label="Usuń (disabled)" disabled />
      </section>
    </main>
  )
}
