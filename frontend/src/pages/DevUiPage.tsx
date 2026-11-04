// Strona pod /dev/ui — dostępna w każdym buildzie, ale nie linkowana z nawigacji aplikacji.
// Każdy task dopisuje tu sekcję ze swoimi komponentami we wszystkich wariantach.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { useTheme } from '@/shared/theme/theme'
import { Button } from '@/shared/components/ui/Button/Button'
import type { ButtonVariant, ButtonSize } from '@/shared/components/ui/Button/Button'
import { IconButton } from '@/shared/components/ui/IconButton/IconButton'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'
import s from './DevUiPage.module.css'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

export default function DevUiPage() {
  const { t, language, setLanguage } = useT()
  const { theme, setTheme } = useTheme()
  const [pressed, setPressed] = useState(false)
  const [tab, setTab] = useState<'projekty' | 'mapy' | 'postacie'>('projekty')
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'bucket'>('pencil')

  const themeOptions = [
    { value: 'dark' as const, label: t('theme.dark') },
    { value: 'light' as const, label: t('theme.light') },
    { value: 'contrast' as const, label: t('theme.contrast') },
  ]

  const langOptions = [
    { value: 'pl' as const, label: t('lang.pl') },
    { value: 'en' as const, label: t('lang.en') },
  ]

  const tabOptions = [
    { value: 'projekty' as const, label: 'Projekty' },
    { value: 'mapy' as const, label: 'Mapy' },
    { value: 'postacie' as const, label: 'Postacie' },
  ]

  return (
    <main className={s.page}>
      <h1>{t('dev.ui.title')}</h1>

      <div className={s.row}>
        <SegmentedControl
          options={themeOptions}
          value={theme}
          onChange={setTheme}
          label={t('theme.label')}
        />
        <SegmentedControl
          options={langOptions}
          value={language}
          onChange={setLanguage}
          label={t('lang.label')}
        />
      </div>

      <section className={s.section}>
        <h2>Button / IconButton</h2>

        <div className={s.group}>
          <p className={s.label}>Warianty × rozmiary</p>
          {VARIANTS.map((variant) => (
            <div key={variant} className={s.row}>
              {SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {variant} {size}
                </Button>
              ))}
            </div>
          ))}
        </div>

        <div className={s.group}>
          <p className={s.label}>Z ikoną</p>
          <div className={s.row}>
            <Button icon="Pencil">Edytuj</Button>
            <Button icon="Trash" variant="danger">
              Usuń
            </Button>
            <Button icon="Download" variant="primary" size="lg">
              Pobierz
            </Button>
          </div>
        </div>

        <div className={s.group}>
          <p className={s.label}>Disabled</p>
          <div className={s.row}>
            <Button disabled>secondary disabled</Button>
            <Button variant="primary" disabled>
              primary disabled
            </Button>
            <Button variant="ghost" disabled>
              ghost disabled
            </Button>
          </div>
        </div>

        <div className={s.group}>
          <p className={s.label}>Pressed (toggle — kliknij, żeby przełączyć)</p>
          <div className={s.row}>
            <Button pressed={pressed} onClick={() => setPressed((p) => !p)}>
              {pressed ? 'Wciśnięty' : 'Normalny'}
            </Button>
          </div>
        </div>

        <div className={s.group}>
          <p className={s.label}>IconButton</p>
          <div className={s.row}>
            <IconButton icon="Pencil" label="Edytuj" />
            <IconButton icon="Pencil" label="Edytuj (sm)" size="sm" />
            <IconButton icon="Pencil" label="Edytuj (lg)" size="lg" />
            <IconButton
              icon="Grid"
              label="Siatka"
              pressed={pressed}
              onClick={() => setPressed((p) => !p)}
            />
            <IconButton icon="Trash" label="Usuń (disabled)" disabled />
          </div>
        </div>
      </section>

      <section className={s.section}>
        <h2>SegmentedControl</h2>

        <div className={s.group}>
          <p className={s.label}>Podstawowy (3 opcje)</p>
          <SegmentedControl
            options={tabOptions}
            value={tab}
            onChange={setTab}
            label="Filtr widoku"
          />
        </div>

        <div className={s.group}>
          <p className={s.label}>Z ikonami</p>
          <SegmentedControl
            options={[
              { value: 'pencil' as const, label: 'Rysuj', icon: 'Pencil' },
              { value: 'eraser' as const, label: 'Gumka', icon: 'Eraser' },
              { value: 'bucket' as const, label: 'Wypełnij', icon: 'PaintBucket' },
            ]}
            value={tool}
            onChange={setTool}
            label="Narzędzie"
          />
        </div>

        <div className={s.group}>
          <p className={s.label}>Rozmiary</p>
          <SegmentedControl
            options={tabOptions}
            value={tab}
            onChange={setTab}
            label="sm"
            size="sm"
          />
          <SegmentedControl
            options={tabOptions}
            value={tab}
            onChange={setTab}
            label="lg"
            size="lg"
          />
        </div>
      </section>
    </main>
  )
}
