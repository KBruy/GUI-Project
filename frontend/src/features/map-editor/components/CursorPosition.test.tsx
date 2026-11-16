import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { useEditorStore } from '../store/editorStore'
import { CursorPosition } from './CursorPosition'

describe('CursorPosition', () => {
  it('shows the map point under the cursor, dashes outside the map', () => {
    useEditorStore.setState({ cursorPoint: { x: 140, y: 214 } })
    render(
      <LanguageProvider>
        <CursorPosition />
      </LanguageProvider>
    )
    const output = screen.getByRole('status', { name: 'Pozycja kursora' })
    expect(output).toHaveTextContent('x 140 · y 214')

    act(() => useEditorStore.getState().setCursorPoint(null))
    expect(output).toHaveTextContent('x – · y –')
  })
})
