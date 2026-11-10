import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '../Icon/Icon'
import { Tooltip } from '../Tooltip/Tooltip'
import styles from './OptionTile.module.css'

export type OptionTileSize = 'sm' | 'md'

// aria-pressed ustawiamy sami z selected, a children to podgląd, nie treść przycisku.
export interface OptionTileProps extends Omit<
  ComponentProps<'button'>,
  'aria-pressed' | 'children'
> {
  // Podpis pod miniaturą; jest też nazwą kafelka dla czytnika ekranu.
  label: string
  // Miniatura z obrazka (np. asset z backendu)...
  imageUrl?: string
  // ...albo własny podgląd. Bez obu = wariant „Brak” (przekreślone pole).
  children?: ReactNode
  selected?: boolean
  // sm: paleta assetów, md: większe kafelki (rozmiar mapy, kreator postaci).
  size?: OptionTileSize
  // Dodatkowy opis w dymku po najechaniu (gotowy tekst).
  tooltip?: string
}

// Kafelek wyboru z miniaturą i podpisem. Działa jak przycisk przełącznik:
// kliknięcie (albo Enter/Spacja) woła onClick, a zaznaczenie pokazuje selected.
export function OptionTile({
  label,
  imageUrl,
  children,
  selected = false,
  size = 'md',
  tooltip,
  type = 'button',
  className,
  ...props
}: OptionTileProps) {
  const tile = (
    <button
      type={type}
      className={[styles.tile, styles[size], className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      {...props}
    >
      <span className={styles.preview}>
        {imageUrl ? (
          // alt="" bo nazwę kafelka daje już podpis pod spodem.
          <img src={imageUrl} alt="" className={styles.image} />
        ) : (
          (children ?? <Icon name="Close" size={size === 'sm' ? 16 : 32} />)
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  )

  return tooltip ? <Tooltip text={tooltip}>{tile}</Tooltip> : tile
}
