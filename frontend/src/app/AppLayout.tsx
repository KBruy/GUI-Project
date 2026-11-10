import { Link, NavLink, Outlet } from 'react-router'
import { useT } from '@/i18n/language'
import type { TranslationKey } from '@/i18n/dictionary'
import { AppFooter } from './AppFooter'
import styles from './AppLayout.module.css'

// Linki w nawigacji. Nowa podstrona w menu = nowy wpis tutaj (trasa w router.tsx).
const NAV_LINKS: { to: string; labelKey: TranslationKey }[] = [
  { to: '/map', labelKey: 'nav.editor' },
  { to: '/character', labelKey: 'nav.characters' },
  { to: '/projects', labelKey: 'nav.projects' },
]

// Wspólna rama każdej podstrony: nagłówek z nawigacją, treść strony (Outlet) i stopka.
export function AppLayout() {
  const { t } = useT()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          {t('app.title')}
        </Link>
        {/* NavLink sam dodaje aria-current="page" aktywnemu linkowi; po nim go stylujemy. */}
        <nav aria-label={t('nav.label')}>
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={styles.link}>
                  {t(link.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <AppFooter />
    </div>
  )
}
