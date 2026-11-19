import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import type { Asset } from '@/shared/lib/assets'
import { createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { AssetPalette } from './AssetPalette'

const GRASS: Asset = {
  id: 'map_terrain_grass_01',
  module: 'map',
  category: 'terrain',
  nameKey: 'assets.map.terrain_grass',
  file: 'map/terrain/map_terrain_grass_01.png',
  width: 32,
  height: 32,
}
const STONE: Asset = {
  ...GRASS,
  id: 'map_nature_stone_01',
  category: 'nature',
  nameKey: 'assets.map.nature_stone',
}

function mockFetch(response: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(response))
}

function renderPalette() {
  render(
    <LanguageProvider>
      <AssetPalette />
    </LanguageProvider>
  )
}

const objects = () => useEditorStore.getState().scene!.layers.flatMap((l) => l.objects)

beforeEach(() => {
  useEditorStore.setState({ assets: [], assetsError: null, assetsStatus: 'idle' })
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  useEditorStore.setState({
    viewport: { width: 640, height: 480 },
    zoom: 1,
    offset: { x: 0, y: 0 },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  useEditorStore.setState({ placingAsset: null, brush: null })
})

// jsdom nie przekazuje współrzędnych ani przycisku do zdarzeń wskaźnika, więc dopisujemy je ręcznie.
function pointer(target: Element | Window, type: 'pointerDown' | 'pointerMove', x: number) {
  const event = createEvent[type](target)
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: 0 },
    button: { value: 0 },
  })
  fireEvent(target, event)
}

describe('AssetPalette', () => {
  it('shows the assets of the first category and picks one as the brush on click', async () => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS, STONE]))))
    renderPalette()
    const tile = await screen.findByRole('button', { name: 'Trawa' })
    expect(screen.queryByRole('button', { name: 'Kamień' })).not.toBeInTheDocument()

    fireEvent.click(tile)
    expect(useEditorStore.getState().brush).toEqual(GRASS)
    expect(tile).toHaveAttribute('aria-pressed', 'true')

    // Drugie kliknięcie kończy stawianie. Samo kliknięcie w paletę niczego nie dodaje.
    fireEvent.click(tile)
    expect(useEditorStore.getState().brush).toBeNull()
    expect(objects()).toHaveLength(0)
  })

  it('starts dragging a tile after a few pixels and then ignores the click', async () => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS, STONE]))))
    renderPalette()
    const tile = await screen.findByRole('button', { name: 'Trawa' })

    pointer(tile, 'pointerDown', 10)
    pointer(window, 'pointerMove', 11)
    expect(useEditorStore.getState().placingAsset).toBeNull()

    pointer(window, 'pointerMove', 20)
    expect(useEditorStore.getState().placingAsset).toEqual(GRASS)

    // Puszczenie nad samym kafelkiem nie wybiera go jako pędzla.
    fireEvent.click(tile)
    expect(useEditorStore.getState().brush).toBeNull()
  })

  it('switches category with the tabs', async () => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS, STONE]))))
    renderPalette()

    fireEvent.click(await screen.findByRole('button', { name: 'Natura' }))

    expect(screen.getByRole('button', { name: 'Kamień' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trawa' })).not.toBeInTheDocument()
  })

  it('shows an error with a retry button when the backend is down', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    renderPalette()

    expect(await screen.findByText('Brak połączenia z serwerem')).toBeInTheDocument()

    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS]))))
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))

    expect(await screen.findByRole('button', { name: 'Trawa' })).toBeInTheDocument()
  })
})
