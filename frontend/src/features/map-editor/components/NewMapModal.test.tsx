import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { useEditorStore } from '../store/editorStore'
import { NewMapModal } from './NewMapModal'

function renderModal(onClose = vi.fn()) {
  render(
    <LanguageProvider>
      <NewMapModal open onClose={onClose} />
    </LanguageProvider>
  )
  return onClose
}

beforeEach(() => {
  useEditorStore.setState({ scene: null, editor: null })
})

describe('NewMapModal', () => {
  it('creates an empty map of the chosen size with one layer', () => {
    const onClose = renderModal()

    fireEvent.change(screen.getByLabelText('Nazwa mapy'), { target: { value: '  Wioska ' } })
    fireEvent.click(screen.getByRole('button', { name: /Średnia/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz' }))

    const scene = useEditorStore.getState().scene!
    expect(scene.name).toBe('Wioska')
    expect([scene.width, scene.height]).toEqual([1280, 960])
    expect(scene.layers).toHaveLength(1)
    expect(scene.layers[0]).toMatchObject({ name: 'Warstwa 1', objects: [] })
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks creating a map without a name and says why', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText('Nazwa mapy'), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: 'Utwórz' })).toBeDisabled()
    expect(screen.getByText('Podaj nazwę mapy')).toBeInTheDocument()
  })
})
