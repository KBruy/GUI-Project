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

// Tak samo jak przy upuszczaniu: jsdom nie przekazuje współrzędnych ani przycisku do zdarzeń wskaźnika.
type PointerType = 'pointerDown' | 'pointerMove' | 'pointerUp'
function pointer(target: Element, type: PointerType, x: number, y: number, shiftKey = false) {
  const event = createEvent[type](target)
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: y },
    button: { value: 0 },
    pointerId: { value: 1 },
    shiftKey: { value: shiftKey },
  })
  fireEvent(target, event)
}
function click(target: Element, x: number, y: number, shiftKey = false) {
  pointer(target, 'pointerDown', x, y, shiftKey)
  pointer(target, 'pointerUp', x, y, shiftKey)
}

const objects = () => useEditorStore.getState().scene!.layers.flatMap((l) => l.objects)

beforeEach(() => {
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  // Zoom 2 i przesunięcie (100, 50): punkt ekranu (164, 114) to punkt sceny (32, 32).
  useEditorStore.setState({ assets: [ROCK], zoom: 2, offset: { x: 100, y: 50 }, gridSnap: true })
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

  describe('selection', () => {
    // Dwa kamienie 32×32: A ze środkiem w (48, 48) i B w (112, 48) w punktach sceny.
    // Na ekranie (zoom 2, przesunięcie 100, 50) ich środki są w (196, 146) i (324, 146).
    function setup() {
      const { container } = render(<MapCanvas />)
      const canvas = container.firstElementChild!
      dropRock(canvas, 164, 114)
      dropRock(canvas, 324, 146)
      const [a, b] = objects().map((o) => o.id)
      return { canvas, a, b }
    }
    const selected = () => useEditorStore.getState().selectedIds

    it('selects an object with a plain click and clears it with a click on an empty spot', () => {
      const { canvas, a } = setup()

      click(canvas, 196, 146)
      expect(selected()).toEqual([a])

      click(canvas, 700, 650)
      expect(selected()).toEqual([])
    })

    it('adds and removes objects with shift and click', () => {
      const { canvas, a, b } = setup()

      click(canvas, 196, 146)
      click(canvas, 324, 146, true)
      expect(selected()).toEqual([a, b])

      click(canvas, 196, 146, true)
      expect(selected()).toEqual([b])
    })

    it('selects objects inside a rectangle dragged over an empty spot', () => {
      const { canvas, a, b } = setup()

      pointer(canvas, 'pointerDown', 100, 50)
      pointer(canvas, 'pointerMove', 260, 210)
      pointer(canvas, 'pointerUp', 260, 210)
      expect(selected()).toEqual([a])

      pointer(canvas, 'pointerDown', 100, 50)
      pointer(canvas, 'pointerMove', 500, 250)
      pointer(canvas, 'pointerUp', 500, 250)
      expect(selected()).toEqual([a, b])
    })

    it('clears the selection with Escape', () => {
      const { canvas, a } = setup()
      click(canvas, 196, 146)
      expect(selected()).toEqual([a])

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(selected()).toEqual([])
    })
  })
  describe('keyboard', () => {
    function setup() {
      const { container } = render(<MapCanvas />)
      dropRock(container.firstElementChild!, 164, 114)
      const [rock] = objects()
      useEditorStore.getState().select([rock.id])
    }

    it('moves the selection with arrows by 1 px, or by one grid cell with shift', () => {
      setup()
      useEditorStore.setState({ gridSnap: false })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(objects()[0]).toMatchObject({ x: 49, y: 48 })

      fireEvent.keyDown(window, { key: 'ArrowDown', shiftKey: true })
      expect(objects()[0]).toMatchObject({ x: 49, y: 80 })
    })

    it('moves to the next grid line with snapping on', () => {
      setup()
      useEditorStore.setState({ gridSnap: false })
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      useEditorStore.setState({ gridSnap: true })

      // Lewa krawędź 33 → następna linia 64, czyli środek 80.
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(objects()[0]).toMatchObject({ x: 80, y: 48 })

      // Krawędź na linii przeskakuje o całe pole.
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(objects()[0]).toMatchObject({ x: 80, y: 16 })
    })

    it('undoes and redoes with ctrl+z and ctrl+shift+z', () => {
      setup()
      useEditorStore.setState({ gridSnap: false })
      fireEvent.keyDown(window, { key: 'ArrowRight' })

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
      expect(objects()[0]).toMatchObject({ x: 48, y: 48 })

      fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true })
      expect(objects()[0]).toMatchObject({ x: 49, y: 48 })
    })
  })
})
