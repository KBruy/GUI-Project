import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'
import { ToolPanel } from './ToolPanel'

it('switches tools with the buttons and with V / B', () => {
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  render(
    <LanguageProvider>
      <ToolPanel />
    </LanguageProvider>
  )
  renderHook(() => useEditorShortcuts())
  const tool = () => useEditorStore.getState().tool

  fireEvent.click(screen.getByRole('button', { name: 'Pędzel (B)' }))
  expect(tool()).toBe('brush')
  expect(screen.getByRole('button', { name: 'Pędzel (B)' })).toHaveAttribute('aria-pressed', 'true')

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }))
  })
  expect(tool()).toBe('select')

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
  })
  expect(tool()).toBe('brush')
  act(() => useEditorStore.getState().setTool('select'))
})
