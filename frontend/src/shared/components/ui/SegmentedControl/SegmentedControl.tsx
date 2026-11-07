import { Button } from '../Button/Button'
import type { ButtonSize } from '../Button/Button'
import type { IconName } from '../Icon/Icon'
import styles from './SegmentedControl.module.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: IconName
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  // Etykieta grupy dla czytników ekranu (role="group" aria-label).
  label: string
  size?: ButtonSize
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <Button
          key={option.value}
          size={size}
          icon={option.icon}
          pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
