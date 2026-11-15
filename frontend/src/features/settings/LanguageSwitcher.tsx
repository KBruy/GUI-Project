import { useT } from '@/i18n/language'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'

// Przełącznik języka. Krótkie kody PL / EN zamiast flag (pxlkit nie ma ikon flag).
// Zapis do localStorage robi LanguageProvider.
export function LanguageSwitcher() {
  const { t, language, setLanguage } = useT()

  return (
    <SegmentedControl
      size="sm"
      label={t('lang.label')}
      value={language}
      onChange={setLanguage}
      options={[
        { value: 'pl', label: 'PL' },
        { value: 'en', label: 'EN' },
      ]}
    />
  )
}
