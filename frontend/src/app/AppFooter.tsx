import { useT } from '@/i18n/language'
import styles from './AppFooter.module.css'

// Licencja ikon Pxlkit (node_modules/@pxlkit/ui/LICENSE) wymaga WIDOCZNEJ atrybucji w aplikacji.
// Nie usuwać, dopóki używamy ikon z @pxlkit/ui lub @pxlkit/feedback.
export function AppFooter() {
  const { t } = useT()

  return (
    <footer className={styles.footer}>
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
    </footer>
  )
}
