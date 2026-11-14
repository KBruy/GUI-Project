import type { ReactNode } from 'react'
import styles from './Field.module.css'

// Wspólna oprawa pól formularza: etykieta nad polem, pod nim błąd.
// Używają jej Input, Select i Slider. Samo pole przychodzi jako children
// i musi mieć to samo id, co podane tutaj (etykieta i błąd wskazują na nie).
export interface FieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
