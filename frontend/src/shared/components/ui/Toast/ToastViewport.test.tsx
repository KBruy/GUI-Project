import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { dismissToast, getToasts, toast } from './toast'
import { ToastViewport } from './ToastViewport'

describe('ToastViewport', () => {
  afterEach(() => {
    act(() => getToasts().forEach((item) => dismissToast(item.id)))
  })

  it('shows a translated toast and closes it with the X button', () => {
    render(
      <LanguageProvider>
        <ToastViewport />
      </LanguageProvider>
    )
    act(() => {
      toast.success('project.saved')
    })
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/zapisany|saved/i)

    fireEvent.click(screen.getByRole('button'))
    expect(status).toBeEmptyDOMElement()
  })
})
