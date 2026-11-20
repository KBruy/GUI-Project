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
