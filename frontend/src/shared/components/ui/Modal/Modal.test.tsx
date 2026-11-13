import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

function renderModal(onClose = vi.fn()) {
  render(
    <Modal open onClose={onClose} title="Nowa mapa" closeLabel="Zamknij">
      <p>Treść okna</p>
    </Modal>
  )
  return onClose
}

describe('Modal', () => {
  it('is labelled by its title', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Nowa mapa' })).toBeInTheDocument()
  })

  // Przeglądarka zamienia Esc w zdarzenie cancel na <dialog>, jsdom tego nie robi,
  // więc wysyłamy cancel ręcznie.
  it('closes on Escape (cancel event) instead of closing by itself', () => {
    const onClose = renderModal()
    const dialog = screen.getByRole('dialog')
    const cancel = new Event('cancel', { cancelable: true })
    fireEvent(dialog, cancel)
    expect(onClose).toHaveBeenCalledOnce()
    expect(cancel.defaultPrevented).toBe(true)
  })

  it('closes on backdrop click, but not on click inside', () => {
    const onClose = renderModal()
    fireEvent.click(screen.getByText('Treść okna'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes with the X button', () => {
    const onClose = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Zamknij' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
