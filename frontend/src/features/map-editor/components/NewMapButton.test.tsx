import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { createMapScene } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { NewMapButton } from './NewMapButton'

function renderButton(autoOpen?: boolean) {
  render(
    <LanguageProvider>
      <NewMapButton autoOpen={autoOpen} />
    </LanguageProvider>
  )
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
})
