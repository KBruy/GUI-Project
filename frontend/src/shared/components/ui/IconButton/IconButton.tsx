import { Button } from '../Button/Button'
import type { ButtonProps } from '../Button/Button'
import type { IconName } from '../Icon/Icon'
import { Tooltip } from '../Tooltip/Tooltip'

// Omit: icon staje się required, children nie ma sensu w przycisku ikonowym,
// aria-label i iconOnly są ustawiane wewnętrznie — nie wystawiamy ich na zewnątrz.
export interface IconButtonProps extends Omit<
  ButtonProps,
  'icon' | 'children' | 'aria-label' | 'iconOnly'
> {
  icon: IconName
  // Wymagany opis: idzie do aria-label (czytniki ekranu) i do Tooltip (widoczny dymek).
  label: string
}

export function IconButton({ icon, label, size, ...props }: IconButtonProps) {
  return (
    <Tooltip text={label}>
      <Button aria-label={label} icon={icon} iconOnly size={size} {...props} />
    </Tooltip>
  )
}
