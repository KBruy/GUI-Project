// Jedyne miejsce w projekcie, gdzie wolno importować z @pxlkit — pilnuje tego reguła ESLint.
import { PxlKitIcon } from '@pxlkit/core'
import {
  Pencil, Eraser, PaintBucket, Eyedropper,
  Undo, Redo, Close, Check,
  Home, Search, Settings, Menu,
  Grid, List, Trash, Edit, Copy,
  Download, Upload, ExternalLink, ChainLink,
} from '@pxlkit/ui'
import {
  CheckCircle, XCircle, InfoCircle,
  WarningTriangle, ErrorOctagon,
  Bell, ShieldCheck, Bug,
} from '@pxlkit/feedback'
import styles from './Icon.module.css'

// Dozwolone ikony. Żeby dodać nową: zaimportuj powyżej i dopisz tutaj.
const icons = {
  // Narzędzia edytora
  Pencil, Eraser, PaintBucket, Eyedropper,
  // Akcje
  Undo, Redo, Close, Check, Trash, Edit, Copy, Download, Upload,
  // Nawigacja
  Home, Search, Settings, Menu, Grid, List, ExternalLink, ChainLink,
  // Statusy i powiadomienia
  CheckCircle, XCircle, InfoCircle, WarningTriangle, ErrorOctagon,
  Bell, ShieldCheck, Bug,
} as const

export type IconName = keyof typeof icons

// Rozmiary jako wielokrotność siatki ikony (16 px).
export type IconSize = 16 | 32 | 48 | 64

interface IconProps {
  name: IconName
  size?: IconSize
  // Z label: kontener dostaje role="img" + aria-label.
  // Bez label: aria-hidden="true" — ikona jest dekoracyjna.
  label?: string
}

export function Icon({ name, size = 16, label }: IconProps) {
  if (label) {
    return (
      <span role="img" aria-label={label} className={styles.icon}>
        <PxlKitIcon icon={icons[name]} size={size} decorative />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className={styles.icon}>
      <PxlKitIcon icon={icons[name]} size={size} decorative />
    </span>
  )
}
