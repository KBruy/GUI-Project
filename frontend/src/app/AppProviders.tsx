import type { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { ToastViewport } from '@/shared/components/ui/Toast/ToastViewport'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
        <ToastViewport />
      </LanguageProvider>
    </ThemeProvider>
  )
}
