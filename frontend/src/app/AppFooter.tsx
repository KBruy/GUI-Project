import { useEffect, useState } from 'react'
import { useT } from '@/i18n/language'
import { api } from '@/shared/lib/apiClient'
import styles from './AppFooter.module.css'

type ServerState = 'checking' | 'online' | 'offline'

const STATUS_KEYS = {
  checking: 'footer.serverChecking',
  online: 'footer.serverOnline',
  offline: 'footer.serverOffline',
} as const

// Co ile sprawdzamy, czy backend odpowiada.
const HEALTH_INTERVAL_MS = 30_000

// Odpytuje GET /api/health od razu po wejściu i potem co 30 s.
function useServerState(): ServerState {
  const [state, setState] = useState<ServerState>('checking')

  useEffect(() => {
    // Po odmontowaniu stopki spóźniona odpowiedź nie może już zmienić stanu.
    let active = true
    const check = () =>
      api.get('/api/health').then(
        () => active && setState('online'),
        () => active && setState('offline')
      )
    check()
    const id = setInterval(check, HEALTH_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return state
}

// Licencja ikon Pxlkit (node_modules/@pxlkit/ui/LICENSE) wymaga WIDOCZNEJ atrybucji w aplikacji.
// Nie usuwać, dopóki używamy ikon z @pxlkit/ui lub @pxlkit/feedback.
export function AppFooter() {
  const { t } = useT()
  const server = useServerState()

  return (
    <footer className={styles.footer}>
      <span>
        {t('footer.icons')}{' '}
        <a href="https://github.com/joangeldelarosa" target="_blank" rel="noreferrer">
          Joangel De La Rosa
        </a>
        {' · '}
        <a
          href="https://github.com/Joangeldelarosa/pxlkit/blob/main/LICENSE-ASSETS"
          target="_blank"
          rel="noreferrer"
        >
          {t('footer.license')}
        </a>
      </span>
      <span role="status" className={styles.server} data-state={server}>
        {t(STATUS_KEYS[server])}
      </span>
    </footer>
  )
}
