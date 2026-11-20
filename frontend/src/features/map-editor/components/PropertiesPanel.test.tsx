import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { addObject, createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { PropertiesPanel } from './PropertiesPanel'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 32 }

const objects = () => useEditorStore.getState().scene!.layers[0].objects

// Dwie kłody: w (100, 50) i (300, 50).
function setup() {
  const store = useEditorStore.getState()
  store.loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  const layerId = useEditorStore.getState().activeLayerId!
  store.execute(addObject(layerId, TREE, { x: 100, y: 50 }))
  store.execute(addObject(layerId, TREE, { x: 300, y: 50 }))
  render(
    <LanguageProvider>
      <PropertiesPanel />
    </LanguageProvider>
  )
  return objects().map((o) => o.id)
}

it('shows a hint, the values of one selected object or the number of selected objects', () => {
  const ids = setup()
  expect(screen.getByText('Zaznacz obiekt na mapie')).toBeInTheDocument()

  act(() => useEditorStore.getState().select([ids[0]]))
  expect(screen.getByText('Warstwa: Warstwa 1')).toBeInTheDocument()
  expect(screen.getByLabelText('X')).toHaveValue(100)
  expect(screen.getByLabelText('Szerokość')).toHaveValue(64)
  expect(screen.getByLabelText('Skala X')).toHaveValue(1)

  act(() => useEditorStore.getState().select(ids))
  expect(screen.getByText('Zaznaczone obiekty: 2')).toBeInTheDocument()
})

it('saves a value on Enter and shows an error when the object would collide', () => {
  const ids = setup()
  act(() => useEditorStore.getState().select([ids[0]]))
  const x = screen.getByLabelText('X')

  x.focus()
  fireEvent.change(x, { target: { value: '150' } })
  fireEvent.keyDown(x, { key: 'Enter' })
  expect(objects()[0].x).toBe(150)
  // Enter wychodzi z pola, żeby działały skróty edytora.
  expect(x).not.toHaveFocus()

  // Na drugiej kłodzie: błąd, a pole wraca do wartości obiektu.
  fireEvent.change(x, { target: { value: '300' } })
  fireEvent.keyDown(x, { key: 'Enter' })
  expect(screen.getByText('Obiekty nachodzą na siebie')).toBeInTheDocument()
  expect(x).toHaveValue(150)
  expect(objects()[0].x).toBe(150)
})

it('sets the same scale for all selected objects in one undo step', () => {
  const ids = setup()
  act(() => useEditorStore.getState().editObjects([ids[0]], { scaleX: 1.5 }))
  act(() => useEditorStore.getState().select(ids))
  const scaleX = screen.getByLabelText('Skala X')
  // Różne wartości: puste pole z podpowiedzią.
  expect(scaleX).toHaveValue(null)
  expect(scaleX).toHaveAttribute('placeholder', 'różne')

  scaleX.focus()
  fireEvent.change(scaleX, { target: { value: '2' } })
  fireEvent.keyDown(scaleX, { key: 'Enter' })
  expect(objects().map((o) => o.scaleX)).toEqual([2, 2])

  act(() => useEditorStore.getState().undo())
  expect(objects().map((o) => o.scaleX)).toEqual([1.5, 1])

  // Skala spoza zakresu: błąd zamiast cichego przycięcia.
  fireEvent.change(scaleX, { target: { value: '-3' } })
  fireEvent.keyDown(scaleX, { key: 'Enter' })
  expect(screen.getByText('Skala poza zakresem')).toBeInTheDocument()
  expect(objects().map((o) => o.scaleX)).toEqual([1.5, 1])
})

it('moves the whole group by its center', () => {
  const ids = setup()
  act(() => useEditorStore.getState().select(ids))
  const x = screen.getByLabelText('X')
  // Kłody w 100 i 300: środek grupy w 200.
  expect(x).toHaveValue(200)

  x.focus()
  fireEvent.change(x, { target: { value: '250' } })
  fireEvent.keyDown(x, { key: 'Enter' })
  expect(objects().map((o) => o.x)).toEqual([150, 350])
})
