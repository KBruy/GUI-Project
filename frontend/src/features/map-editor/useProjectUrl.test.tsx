import { act, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useParams } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, getToasts } from '@/shared/components/ui/Toast/toast'
import { createMapScene, MAP_SIZES } from './engine/engine'
import { useEditorStore } from './store/editorStore'
import { useProjectUrl } from './useProjectUrl'

function Editor() {
  const { id } = useParams()
  useProjectUrl(id)
  return null
}

function renderAt(url: string) {
  const router = createMemoryRouter([{ path: '/map/:id?', element: <Editor /> }], {
    initialEntries: [url],
  })
  render(<RouterProvider router={router} />)
  return router
}

const newScene = () => createMapScene('Test', MAP_SIZES[0], 'Warstwa 1')
const respond = (body: unknown, status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })))
  )

beforeEach(() => {
  useEditorStore.getState().loadScene(newScene())
})

afterEach(() => {
  vi.unstubAllGlobals()
  act(() => getToasts().forEach((item) => dismissToast(item.id)))
})

describe('useProjectUrl', () => {
  it('opens the project from the address', async () => {
    respond({ ...newScene(), id: 'p-1', name: 'Zapisana' })
    const router = renderAt('/map/p-1')

    await waitFor(() => expect(useEditorStore.getState().scene?.name).toBe('Zapisana'))
    expect(useEditorStore.getState().projectId).toBe('p-1')
    expect(router.state.location.pathname).toBe('/map/p-1')
  })

  it('moves to the project address after the first save', async () => {
    respond({ ...newScene(), id: 'p-1' })
    const router = renderAt('/map')

    await act(() => useEditorStore.getState().save())
    expect(router.state.location.pathname).toBe('/map/p-1')
  })

  it('goes back to /map when a new map replaces the project', async () => {
    respond({ ...newScene(), id: 'p-1' })
    const router = renderAt('/map/p-1')
    await waitFor(() => expect(useEditorStore.getState().projectId).toBe('p-1'))

    act(() => useEditorStore.getState().loadScene(newScene()))
    expect(router.state.location.pathname).toBe('/map')
  })

  it('shows an error and goes back to /map when the project does not exist', async () => {
    respond({ error: { code: 'PROJECT_NOT_FOUND', messageKey: 'errors.projectNotFound' } }, 404)
    const router = renderAt('/map/nope')

    await waitFor(() => expect(router.state.location.pathname).toBe('/map'))
    expect(getToasts().map((item) => item.messageKey)).toEqual(['errors.projectNotFound'])
  })
})
