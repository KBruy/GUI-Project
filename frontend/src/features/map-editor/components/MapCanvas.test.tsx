import { act, createEvent, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Asset } from '@/shared/lib/assets'
import { createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
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

// jsdom nie przekazuje współrzędnych ani przycisku do zdarzeń wskaźnika, więc dopisujemy je ręcznie.
type PointerType = 'pointerDown' | 'pointerMove' | 'pointerUp'
function pointer(
  target: Element | Window,
  type: PointerType,
  x: number,
  y: number,
  shiftKey = false
) {
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
// Przeciągnięcie kamienia z palety: paleta ustawia placingAsset, a dalej kursor jedzie po oknie.
// Pierwszy argument zostaje dla czytelności testów (upuszczamy „na canvas”).
function dropRock(_canvas: Element, x: number, y: number) {
  act(() => useEditorStore.getState().setPlacingAsset(ROCK))
  pointer(window, 'pointerMove', x, y)
  pointer(window, 'pointerUp', x, y)
}

function click(target: Element, x: number, y: number, shiftKey = false) {
  pointer(target, 'pointerDown', x, y, shiftKey)
  pointer(target, 'pointerUp', x, y, shiftKey)
}

// Canvas 1000×800 także dla useElementSize: zaślepka ResizeObserver z setup.ts nic nie mierzy.
// Viewport w store jest ustawiony wcześniej, żeby pierwszy pomiar nie dopasował sceny do ekranu.
function measureCanvas() {
  useEditorStore.setState({ viewport: { width: 1000, height: 800 } })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }
      observe() {
        const entry = { contentRect: { width: 1000, height: 800 } } as ResizeObserverEntry
        this.callback([entry], this as unknown as ResizeObserver)
      }
      unobserve() {}
      disconnect() {}
    }
  )
}

const objects = () => useEditorStore.getState().scene!.layers.flatMap((l) => l.objects)

beforeEach(() => {
  // jsdom nie liczy układu strony: canvas ma rozmiar 0, więc podajemy mu prostokąt 1000×800 od (0, 0).
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width: 1000, height: 800 })
  )
  useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  // Zoom 2 i przesunięcie (100, 50): punkt ekranu (164, 114) to punkt sceny (32, 32).
  useEditorStore.setState({ assets: [ROCK], zoom: 2, offset: { x: 100, y: 50 }, gridSnap: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
  useEditorStore.getState().setPlacingAsset(null)
})

describe('MapCanvas', () => {
  it('adds a dragged palette asset where it was dropped', () => {
    const { container } = render(<MapCanvas />)

    dropRock(container.firstElementChild!, 164, 114)

    // Środek pod kursorem (32, 32) → lewy górny róg (16, 16) → siatka (32, 32) → środek (48, 48).
    expect(objects()).toHaveLength(1)
    expect(objects()[0]).toMatchObject({ assetId: ROCK.id, x: 48, y: 48 })
  })

  it('shows a preview with coordinates while dragging from the palette, outside the canvas none', () => {
    const { container } = render(<MapCanvas />)
    act(() => useEditorStore.getState().setPlacingAsset(ROCK))

    pointer(window, 'pointerMove', 164, 114)
    expect(container).toHaveTextContent('48, 48')

    pointer(window, 'pointerMove', -20, 114)
    expect(container).not.toHaveTextContent('48, 48')
  })

  it('treats the empty canvas around the map as outside: no preview, no drop', () => {
    const { container } = render(<MapCanvas />)
    act(() => useEditorStore.getState().setPlacingAsset(ROCK))

    // Ekran (60, 114) jest na canvasie, ale to punkt sceny (-20, 32), czyli obok mapy.
    pointer(window, 'pointerMove', 60, 114)
    expect(container.querySelector('img')).toHaveStyle({ left: '60px', top: '114px' })
    expect(container).not.toHaveTextContent(',')

    pointer(window, 'pointerUp', 60, 114)
    expect(objects()).toHaveLength(0)
  })

  it('shows the asset image next to the cursor before it reaches the canvas', () => {
    const { container } = render(<MapCanvas />)
    act(() => useEditorStore.getState().setPlacingAsset(ROCK))

    // Zoom 2: kamień 32×32 ma na ekranie 64×64, środek pod kursorem.
    pointer(window, 'pointerMove', -20, 114)
    expect(container.querySelector('img')).toHaveStyle({
      left: '-20px',
      top: '114px',
      width: '64px',
      height: '64px',
    })

    pointer(window, 'pointerMove', 164, 114)
    expect(container.querySelector('img')).toBeNull()
  })

  it('cancels dragging from the palette with Escape', () => {
    render(<MapCanvas />)
    act(() => useEditorStore.getState().setPlacingAsset(ROCK))
    pointer(window, 'pointerMove', 164, 114)

    fireEvent.keyDown(window, { key: 'Escape' })
    pointer(window, 'pointerUp', 164, 114)

    expect(objects()).toHaveLength(0)
    expect(useEditorStore.getState().placingAsset).toBeNull()
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

    it('shows the moved object position for a moment after an arrow press', () => {
      vi.useFakeTimers()
      measureCanvas()
      setup()
      useEditorStore.setState({ gridSnap: false })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      // Tuż przy prawym dolnym rogu kamienia: (49 + 16) · 2 + 100 = 230, (48 + 16) · 2 + 50 = 178.
      const label = screen.getByText('49, 48')
      expect(label).toHaveStyle({ left: '230px', top: '178px' })
      expect(label.style.transform).toBe('translate(4px, 4px)')

      act(() => vi.advanceTimersByTime(1500))
      expect(document.body).not.toHaveTextContent('49, 48')
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
  describe('dragging objects', () => {
    // Te same dwa kamienie co przy zaznaczaniu: A w (48, 48), B w (112, 48), 1 px sceny = 2 px ekranu.
    function setup() {
      const { container } = render(<MapCanvas />)
      const canvas = container.firstElementChild!
      dropRock(canvas, 164, 114)
      dropRock(canvas, 324, 146)
      const [a, b] = objects().map((o) => o.id)
      return { canvas, a, b }
    }
    function dragFrom(
      canvas: Element,
      x: number,
      y: number,
      dx: number,
      dy: number,
      shift = false
    ) {
      pointer(canvas, 'pointerDown', x, y, shift)
      pointer(canvas, 'pointerMove', x + dx, y + dy, shift)
      pointer(canvas, 'pointerUp', x + dx, y + dy, shift)
    }
    const position = (id: string) => objects().find((o) => o.id === id)!

    it('moves a grabbed object and snaps it to the grid', () => {
      const { canvas, a } = setup()

      // +50 px sceny: lewy górny róg 82 → najbliższa linia 96, czyli środek 112.
      dragFrom(canvas, 196, 146, 100, 100)

      expect(position(a)).toMatchObject({ x: 112, y: 112 })
      expect(useEditorStore.getState().selectedIds).toEqual([a])
    })

    it('shows the grabbed object position next to the cursor while dragging', () => {
      const { canvas } = setup()

      pointer(canvas, 'pointerDown', 196, 146)
      pointer(canvas, 'pointerMove', 296, 246)
      expect(canvas).toHaveTextContent('112, 112')

      pointer(canvas, 'pointerUp', 296, 246)
      expect(canvas).not.toHaveTextContent('112, 112')
    })

    it('keeps the label next to the object when the cursor leaves the map', () => {
      measureCanvas()
      const { canvas } = setup()

      // Kamień A zatrzymuje się na lewym brzegu mapy (środek 16), a kursor jedzie dalej w lewo.
      // Lewa krawędź A na ekranie to 100 (przesunięcie), więc etykieta stoi w 100 (+16 px odstępu).
      pointer(canvas, 'pointerDown', 196, 146)
      pointer(canvas, 'pointerMove', -400, 146)

      const label = screen.getByText('16, 48')
      expect(label).toHaveStyle({ left: '100px', top: '146px' })
      expect(label.style.transform).toBe('translate(16px, 16px)')
    })

    it('flips the label to the other side of the cursor near the canvas edge', () => {
      measureCanvas()
      const { canvas } = setup()

      // Kursor 10 px od prawej i dolnej krawędzi canvasu 1000×800: etykieta staje po lewej i nad nim.
      pointer(canvas, 'pointerDown', 196, 146)
      pointer(canvas, 'pointerMove', 990, 790)

      const label = screen.getByText('432, 368')
      expect(label).toHaveStyle({ left: '990px', top: '790px' })
      expect(label.style.transform).toBe('translate(calc(-100% - 16px), calc(-100% - 16px))')
    })

    it('leaves the object in place when dropped on another one', () => {
      const { canvas, a } = setup()

      dragFrom(canvas, 196, 146, 128, 0)

      expect(position(a)).toMatchObject({ x: 48, y: 48 })
    })

    it('moves every selected object together', () => {
      const { canvas, a, b } = setup()
      click(canvas, 196, 146)
      click(canvas, 324, 146, true)

      dragFrom(canvas, 196, 146, 0, 128)

      expect(position(a)).toMatchObject({ x: 48, y: 112 })
      expect(position(b)).toMatchObject({ x: 112, y: 112 })
    })

    it('keeps only the clicked object selected after a click without dragging', () => {
      const { canvas, a, b } = setup()
      click(canvas, 196, 146)
      click(canvas, 324, 146, true)

      click(canvas, 324, 146)

      expect(useEditorStore.getState().selectedIds).toEqual([b])
      expect(position(a)).toMatchObject({ x: 48, y: 48 })
    })
  })
})
