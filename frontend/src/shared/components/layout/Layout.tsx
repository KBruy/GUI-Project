import type { ComponentProps, CSSProperties } from 'react'
import styles from './Layout.module.css'

// --- Container ---

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={[styles.container, className].filter(Boolean).join(' ')} {...props} />
}

// --- Stack ---

export interface StackProps extends ComponentProps<'div'> {
  direction?: 'row' | 'column'
  gap?: 1 | 2 | 3 | 4 | 5 | 6
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
}

export function Stack({
  direction = 'column',
  gap = 3,
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: StackProps) {
  return (
    <div
      className={[styles.stack, className].filter(Boolean).join(' ')}
      style={{
        flexDirection: direction,
        gap: `var(--space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...props}
    />
  )
}

// --- Panel ---

export interface PanelProps extends ComponentProps<'section'> {
  title?: string
}

export function Panel({ title, className, children, ...props }: PanelProps) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')} {...props}>
      {title && <h2 className={styles.panelTitle}>{title}</h2>}
      {children}
    </section>
  )
}

// --- Toolbar ---

export interface ToolbarProps extends Omit<ComponentProps<'div'>, 'role'> {
  label: string
}

export function Toolbar({ label, className, ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={[styles.toolbar, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// --- Sidebar ---

export interface SidebarProps extends ComponentProps<'aside'> {
  width?: CSSProperties['width']
  side?: 'left' | 'right'
}

export function Sidebar({ width, side, className, style, ...props }: SidebarProps) {
  return (
    <aside
      className={[styles.sidebar, className].filter(Boolean).join(' ')}
      style={{ width, ...style }}
      data-side={side}
      {...props}
    />
  )
}
