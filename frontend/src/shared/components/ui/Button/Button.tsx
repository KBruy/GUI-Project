import { useEffect, useRef } from 'react'
import type { ComponentProps } from 'react'
import { Icon } from '../Icon/Icon'
import type { IconName } from '../Icon/Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Mapa rozmiaru przycisku → rozmiar ikony (wielokrotność siatki 16 px).
const ICON_SIZE: Record<ButtonSize, 16 | 32> = { sm: 16, md: 16, lg: 32 }

// aria-pressed jest obsługiwane przez prop pressed — Omit zapobiega kolizji z ...props.
export interface ButtonProps extends Omit<ComponentProps<'button'>, 'aria-pressed' | 'ref'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  // Prop dla przycisków toggle: ustawia aria-pressed i wygląd wciśnięty.
  // Pominięty prop = brak atrybutu aria-pressed w DOM (nie false, tylko brak).
  pressed?: boolean
  // Symetryczne paddingi dla przycisku bez tekstu (używane przez IconButton).
  iconOnly?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  pressed,
  iconOnly,
  type = 'button',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  // Firefox nie wysyła zdarzeń klawiatury, gdy fokus zostaje na przycisku, który właśnie się
  // wyłączył (np. strzałka warstwy na samej górze albo „Cofnij” po ostatnim cofnięciu).
  // Wtedy przestają działać skróty edytora, więc zdejmujemy z niego fokus.
  useEffect(() => {
    if (disabled && ref.current === document.activeElement) ref.current?.blur()
  }, [disabled])

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.iconOnly,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={pressed}
      {...props}
    >
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
    </button>
  )
}
