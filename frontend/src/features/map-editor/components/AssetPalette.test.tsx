import { fireEvent, render, screen } from '@testing-library/react'
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
})

describe('AssetPalette', () => {
  it('shows the assets of the first category and adds one to the map on click', async () => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS, STONE]))))
    renderPalette()

    fireEvent.click(await screen.findByRole('button', { name: 'Trawa' }))

    expect(screen.queryByRole('button', { name: 'Kamień' })).not.toBeInTheDocument()
    expect(objects()).toHaveLength(1)
    expect(objects()[0].assetId).toBe(GRASS.id)
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

  it('adds the next click next to the previous object', async () => {
    mockFetch(() => Promise.resolve(new Response(JSON.stringify([GRASS]))))
    renderPalette()
    const tile = await screen.findByRole('button', { name: 'Trawa' })

    fireEvent.click(tile)
    fireEvent.click(tile)

    expect(objects()).toHaveLength(2)
  })
})
