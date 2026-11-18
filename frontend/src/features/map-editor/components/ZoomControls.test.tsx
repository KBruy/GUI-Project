import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { createMapScene } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { ZoomControls } from './ZoomControls'

beforeEach(() => {
  useEditorStore.setState({ viewport: { width: 0, height: 0 } })
  useEditorStore.getState().loadScene(createMapScene('Test', { width: 640, height: 480 }))
  // 640×480 na ekranie 704×544 (z marginesem 32 px) daje równe 100%.
  useEditorStore.getState().setViewport({ width: 704, height: 544 })
})

function renderControls() {
  render(
    <LanguageProvider>
      <ZoomControls />
    </LanguageProvider>
  )
}

describe('ZoomControls', () => {
  it('shows the zoom in percent and changes it with the buttons', () => {
    renderControls()
    expect(screen.getByText('100%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Przybliż' }))
    expect(screen.getByText('125%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dopasuj' }))
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('disables zoom in at 400%', () => {
    useEditorStore.getState().zoomTo(4)
    renderControls()

    expect(screen.getByRole('button', { name: 'Przybliż' })).toBeDisabled()
  })
})
