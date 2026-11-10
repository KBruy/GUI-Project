import { useId } from 'react'
import type { ComponentProps } from 'react'
import { Field } from '../Field/Field'
import styles from './Slider.module.css'

// Suwak na natywnym <input type="range"> (strzałki, Home i End działają same).
// onChange dostaje od razu liczbę. Obok suwaka widać aktualną wartość.
export interface SliderProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  label: string
  value: number
  onChange: (value: number) => void
  // Gotowy tekst błędu (strona robi t('...')). Pusty = brak błędu.
  error?: string
}

export function Slider({ label, value, onChange, error, id, className, ...props }: SliderProps) {
  const generatedId = useId()
  const sliderId = id ?? generatedId

  return (
    <Field id={sliderId} label={label} error={error}>
      <span className={styles.row}>
        <input
          id={sliderId}
          type="range"
          className={[styles.slider, className].filter(Boolean).join(' ')}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${sliderId}-error` : undefined}
          {...props}
        />
        <output htmlFor={sliderId} className={styles.value}>
          {value}
        </output>
      </span>
    </Field>
  )
}
