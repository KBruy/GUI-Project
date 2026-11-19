import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { dismissToast, getToasts } from '@/shared/components/ui/Toast/toast'
import { addObject, createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { useEditorShortcuts } from '../useEditorShortcuts'
import { SaveButton } from './SaveButton'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 64 }
const toasts = () => getToasts().map((item) => [item.type, item.messageKey])

// Backend odpowiada zapisaną sceną z nowym id.
function stubBackend() {
  const fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ ...useEditorStore.getState().scene, id: 'p-1' }), {
        status: 201,
      })
    )
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function renderButton() {
  render(
    <LanguageProvider>
      <SaveButton />
    </LanguageProvider>
  )
  return screen.getByRole('button', { name: 'Zapisz' })
}

beforeEach(() => {
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  act(() => getToasts().forEach((item) => dismissToast(item.id)))
})

describe('SaveButton', () => {
  it('marks unsaved changes and clears the mark after saving', async () => {
    const fetch = stubBackend()
    const button = renderButton()
    expect(button).not.toHaveTextContent('*')

    const layerId = useEditorStore.getState().activeLayerId!
    act(() => {
      useEditorStore.getState().execute(addObject(layerId, TREE, { x: 100, y: 100 }))
    })
    expect(button).toHaveTextContent('Zapisz *')

    fireEvent.click(button)
    await waitFor(() => expect(button).not.toHaveTextContent('*'))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(useEditorStore.getState().projectId).toBe('p-1')
    expect(toasts()).toEqual([['success', 'project.saved']])
  })

  it('shows the error and keeps the changes unsaved when the backend is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    )
    const button = renderButton()

    fireEvent.click(button)
    await waitFor(() => expect(toasts()).toEqual([['error', 'errors.network']]))
    expect(button).toBeEnabled()
    expect(useEditorStore.getState().projectId).toBeNull()
  })

  it('saves with Ctrl+S and Cmd+S', async () => {
    const fetch = stubBackend()
    renderHook(() => useEditorShortcuts())

    const ctrlS = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true })
    act(() => {
      window.dispatchEvent(ctrlS)
    })
    // Przeglądarka nie otwiera swojego okna „Zapisz stronę jako”.
    expect(ctrlS.defaultPrevented).toBe(true)
    await waitFor(() => expect(useEditorStore.getState().projectId).toBe('p-1'))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }))
    })
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(fetch.mock.calls[1]).toEqual([expect.stringMatching(/\/p-1$/), expect.anything()])
  })
})
