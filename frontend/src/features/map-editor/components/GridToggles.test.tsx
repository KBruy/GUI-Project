import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { useEditorStore } from '../store/editorStore'
import { GridToggles } from './GridToggles'

afterEach(() => {
  useEditorStore.getState().setGridVisible(true)
  useEditorStore.getState().setGridSnap(true)
})

describe('GridToggles', () => {
  it('switches grid visibility and snapping in the store', () => {
    render(
      <LanguageProvider>
        <GridToggles />
      </LanguageProvider>
    )
    const grid = screen.getByRole('button', { name: 'Siatka' })
    const snap = screen.getByRole('button', { name: 'Przyciąganie' })
    expect(grid).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(grid)
    fireEvent.click(snap)

    expect(grid).toHaveAttribute('aria-pressed', 'false')
    expect(snap).toHaveAttribute('aria-pressed', 'false')
    expect(useEditorStore.getState().gridVisible).toBe(false)
    expect(useEditorStore.getState().gridSnap).toBe(false)
  })
})
