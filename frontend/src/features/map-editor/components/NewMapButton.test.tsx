import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { createMapScene } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { NewMapButton, OPEN_AFTER_ERROR_MS } from './NewMapButton'

function renderButton(autoOpen?: boolean) {
  const button = (open?: boolean) => (
    <LanguageProvider>
      <NewMapButton autoOpen={open} />
    </LanguageProvider>
  )
  const { rerender } = render(button(autoOpen))
  return { rerender: (open: boolean) => rerender(button(open)) }
}

describe('NewMapButton', () => {
  it('opens the new map window by itself when no map is loaded', () => {
    useEditorStore.setState({ scene: null })
    renderButton()

    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('open')
  })

  it('stays closed when a map is already loaded', () => {
    useEditorStore.getState().loadScene(createMapScene('Test', { width: 640, height: 480 }))
    renderButton()

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })

  it('stays closed while a saved project is being opened', () => {
    useEditorStore.setState({ scene: null })
    renderButton(false)

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })

  it('opens a moment later when the saved project fails to load', () => {
    vi.useFakeTimers()
    useEditorStore.setState({ scene: null })
    const { rerender } = renderButton(false)

    // Adres wrócił na /map: najpierw widać toast z błędem, potem okno.
    rerender(true)
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
    act(() => vi.advanceTimersByTime(OPEN_AFTER_ERROR_MS))
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('open')
    vi.useRealTimers()
  })
})
