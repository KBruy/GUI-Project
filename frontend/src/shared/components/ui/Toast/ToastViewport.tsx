import { useSyncExternalStore } from 'react'
import { useT } from '@/i18n/language'
import animations from '@/shared/animations/animations.module.css'
import { Icon } from '../Icon/Icon'
import type { IconName } from '../Icon/Icon'
import { IconButton } from '../IconButton/IconButton'
import { dismissToast, getToasts, subscribeToasts } from './toast'
import type { ToastType } from './toast'
import styles from './ToastViewport.module.css'

const ICONS: Record<ToastType, IconName> = {
  success: 'CheckCircle',
  error: 'XCircle',
  info: 'InfoCircle',
}

// Miejsce na toasty w prawym dolnym rogu. Wstawione raz, w AppProviders.
// Jedyny komponent shared, który sam tłumaczy (toasty przychodzą jako klucze).
export function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)
  const { t } = useT()

  // role="status": czytnik ekranu przeczyta nowy toast, nie przerywając użytkownikowi.
  return (
    <div role="status" className={styles.viewport}>
      {toasts.map((item) => (
        <div key={item.id} className={`${styles.toast} ${styles[item.type]} ${animations.fadeIn}`}>
          <Icon name={ICONS[item.type]} />
          <p className={styles.message}>{t(item.messageKey)}</p>
          <IconButton
            icon="Close"
            label={t('actions.close')}
            variant="ghost"
            size="sm"
            onClick={() => dismissToast(item.id)}
          />
        </div>
      ))}
    </div>
  )
}
