import { useId } from 'react'
import type { ComponentProps } from 'react'
import { Field } from '../Field/Field'
import fieldStyles from '../Field/Field.module.css'

// Pole tekstowe lub liczbowe (type="number"). Przyjmuje wszystkie propsy <input>,
// więc value i onChange działają jak w zwykłym inpucie.
export interface InputProps extends ComponentProps<'input'> {
  label: string
  // Gotowy tekst błędu (strona robi t('...')). Pusty = brak błędu.
  error?: string
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} error={error}>
      <input
        id={inputId}
        className={[fieldStyles.control, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
    </Field>
  )
}
