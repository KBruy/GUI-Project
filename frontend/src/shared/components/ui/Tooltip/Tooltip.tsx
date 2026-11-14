import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import animations from '@/shared/animations/animations.module.css'
import styles from './Tooltip.module.css'

const SHOW_DELAY_MS = 300
// Odstęp dymka od elementu i minimalny odstęp od krawędzi ekranu (px).
const GAP = 8
const SCREEN_MARGIN = 8

export interface TooltipProps {
  text: string
  children: ReactNode
}

// Dymek nad elementem, po najechaniu myszą albo po fokusie z klawiatury (z opóźnieniem).
// Jest tylko wizualny: tekst dla czytników ekranu musi mieć sam element
// (np. aria-label w IconButton), inaczej czytnik przeczytałby go dwa razy.
export function Tooltip({ text, children }: TooltipProps) {
  // Gdzie wstawić dymek; null = dymek schowany. Zwykle body, ale wewnątrz Modala
  // sam <dialog>, bo okno modalne leży nad całą stroną i zakryłoby dymek z body.
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const visible = container !== null
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | undefined>(undefined)

  function show() {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setContainer(triggerRef.current?.closest('dialog') ?? document.body)
    }, SHOW_DELAY_MS)
  }

  function hide() {
    window.clearTimeout(timerRef.current)
    setContainer(null)
  }

  // Sprzątanie timera, gdy komponent znika ze strony.
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  // Gdy dymek jest widoczny: Esc go chowa (wymóg dostępności dla treści po najechaniu),
  // a przewijanie też, bo dymek ma stałą pozycję na ekranie i jechałby razem z kursorem.
  // capture: true łapie przewijanie każdego kontenera, nie tylko całej strony.
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContainer(null)
    }
    const onScroll = () => setContainer(null)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [visible])

  // Pozycja liczona przed narysowaniem: nad elementem, wyśrodkowany,
  // przesunięty tak, żeby nie wyszedł poza ekran; gdy brak miejsca u góry, idzie pod element.
  useLayoutEffect(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!visible || !trigger || !tooltip) return

    const target = trigger.getBoundingClientRect()
    const box = tooltip.getBoundingClientRect()

    let left = target.left + target.width / 2 - box.width / 2
    left = Math.max(SCREEN_MARGIN, Math.min(left, window.innerWidth - box.width - SCREEN_MARGIN))

    let top = target.top - box.height - GAP
    if (top < SCREEN_MARGIN) top = target.bottom + GAP

    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
  }, [visible])

  return (
    <span
      ref={triggerRef}
      className={styles.trigger}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {/* Portal: dymek nie jest obcinany przez overflow ani przesuwany przez transform rodzica. */}
      {container &&
        createPortal(
          <span
            ref={tooltipRef}
            className={`${styles.tooltip} ${animations.fadeIn}`}
            aria-hidden="true"
          >
            {text}
          </span>,
          container
        )}
    </span>
  )
}
