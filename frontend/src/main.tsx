import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/theme.css'
import '@/shared/styles/global.css'
import { getInitialTheme } from '@/shared/theme/theme'
import { getInitialLanguage } from '@/i18n/language'
import { AppProviders } from '@/app/AppProviders'
import App from '@/app/App.tsx'

// Ustawia data-theme synchronicznie przed pierwszym renderem Reacta,
// żeby przeglądarka zastosowała właściwe zmienne CSS zanim namaluje cokolwiek
// na ekranie (eliminuje FOUC — błysk złego motywu przy ładowaniu).
document.documentElement.setAttribute('data-theme', getInitialTheme())
// lang potrzebne od razu dla czytników ekranu, zanim React zamontuje LanguageProvider.
document.documentElement.lang = getInitialLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
