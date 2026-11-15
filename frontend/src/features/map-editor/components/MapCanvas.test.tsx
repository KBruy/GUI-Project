import { createEvent, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Asset } from '@/shared/lib/assets'
import { createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { ASSET_DRAG_TYPE } from './AssetPalette'
import { MapCanvas } from './MapCanvas'

const ROCK: Asset = {
  id: 'map_objects_rock_01',
  module: 'map',
  category: 'objects',
  nameKey: 'assets.map.rock',
  file: 'map/objects/map_objects_rock_01.png',
  width: 32,
  height: 32,
}

// jsdom nie ma DataTransfer, więc podajemy tylko to, czego używa MapCanvas.
function dropRock(target: Element, x: number, y: number) {
  const dataTransfer = { types: [ASSET_DRAG_TYPE], getData: () => ROCK.id }
  fireEvent.dragOver(target, { dataTransfer })
  // jsdom nie ma też DragEvent, więc współrzędne kursora dopisujemy do zwykłego zdarzenia.
  const drop = createEvent.drop(target, { dataTransfer })
  Object.defineProperties(drop, { clientX: { value: x }, clientY: { value: y } })
  fireEvent(target, drop)
}

const objects = () => useEditorStore.getState().scene!.layers.flatMap((l) => l.objects)

beforeEach(() => {
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  // Zoom 2 i przesunięcie (100, 50): punkt ekranu (164, 114) to punkt sceny (32, 32).
  useEditorStore.setState({ assets: [ROCK], zoom: 2, offset: { x: 100, y: 50 } })
})

describe('MapCanvas', () => {
  it('adds a dragged palette asset where it was dropped', () => {
    const { container } = render(<MapCanvas />)

    dropRock(container.firstElementChild!, 164, 114)

    // Środek pod kursorem (32, 32) → lewy górny róg (16, 16) → siatka (32, 32) → środek (48, 48).
    expect(objects()).toHaveLength(1)
    expect(objects()[0]).toMatchObject({ assetId: ROCK.id, x: 48, y: 48 })
  })

  it('does not drop on top of another object', () => {
    const { container } = render(<MapCanvas />)

    dropRock(container.firstElementChild!, 164, 114)
    dropRock(container.firstElementChild!, 164, 114)

    expect(objects()).toHaveLength(1)
  })
})
