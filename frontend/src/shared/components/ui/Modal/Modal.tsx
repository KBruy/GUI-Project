import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react'
import animations from '@/shared/animations/animations.module.css'
import { IconButton } from '../IconButton/IconButton'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  // Wołane przy Esc, kliknięciu w tło i przycisku X. Strona ustawia wtedy open={false}.
  onClose: () => void
  title: string
  // Opis przycisku X dla czytników i Tooltipa (gotowy tekst, np. t('actions.close')).
  closeLabel: string
  children: ReactNode
  // Przyciski na dole okna, np. Anuluj i Zapisz.
  actions?: ReactNode
}

// Okno modalne na natywnym <dialog> z showModal(). Przeglądarka sama daje:
// zablokowanie reszty strony, fokus w środku i powrót fokusu po zamknięciu.
export function Modal({ open, onClose, title, closeLabel, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // Otwieranie i zamykanie sterowane propem open.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Esc: przeglądarka wysyła zdarzenie cancel. Blokujemy domyślne zamknięcie,
  // żeby o zamknięciu zawsze decydowała strona (open), a nie sam dialog.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  // Kliknięcie w tło trafia w sam <dialog>, bo cała treść jest w środkowym div.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${animations.fadeIn}`}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton icon="Close" label={closeLabel} variant="ghost" size="sm" onClick={onClose} />
        </header>
        <div>{children}</div>
        {actions && <footer className={styles.actions}>{actions}</footer>}
      </div>
    </dialog>
  )
}
