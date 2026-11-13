import { useId } from 'react'
import type { ComponentProps } from 'react'
import { Field } from '../Field/Field'
import fieldStyles from '../Field/Field.module.css'
import styles from './Select.module.css'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

// Lista rozwijana na natywnym <select> (strzałki i wpisywanie liter działają same).
// Opcje i onChange jak w SegmentedControl: onChange dostaje od razu wartość.
export interface SelectProps<T extends string> extends Omit<
  ComponentProps<'select'>,
  'value' | 'onChange' | 'children'
> {
  label: string
  options: SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  // Gotowy tekst błędu (strona robi t('...')). Pusty = brak błędu.
  error?: string
}

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  id,
  className,
  ...props
}: SelectProps<T>) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <Field id={selectId} label={label} error={error}>
      <span className={styles.wrapper}>
        <select
          id={selectId}
          className={[fieldStyles.control, styles.select, className].filter(Boolean).join(' ')}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </Field>
  )
}
