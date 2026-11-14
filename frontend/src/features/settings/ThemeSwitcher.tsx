import { useT } from '@/i18n/language'
import { useTheme } from '@/shared/theme/theme'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'

// Przełącznik motywu. Zapis do localStorage robi ThemeProvider, więc wybór zostaje po odświeżeniu.
export function ThemeSwitcher() {
  const { t } = useT()
  const { theme, setTheme } = useTheme()

  return (
    <SegmentedControl
      size="sm"
      label={t('theme.label')}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'dark', label: t('theme.dark') },
        { value: 'light', label: t('theme.light') },
        { value: 'contrast', label: t('theme.contrast') },
      ]}
    />
  )
}
