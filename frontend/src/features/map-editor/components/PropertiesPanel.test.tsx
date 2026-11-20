import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { addObject, createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { PropertiesPanel } from './PropertiesPanel'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 32 }

it('shows a hint, the values of one selected object or the number of selected objects', () => {
  const store = useEditorStore.getState()
  store.loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
  const layerId = useEditorStore.getState().activeLayerId!
  store.execute(addObject(layerId, TREE, { x: 100, y: 50 }))
  store.execute(addObject(layerId, TREE, { x: 300, y: 50 }))
  const ids = useEditorStore.getState().scene!.layers[0].objects.map((o) => o.id)
  render(
    <LanguageProvider>
      <PropertiesPanel />
    </LanguageProvider>
  )
  expect(screen.getByText('Zaznacz obiekt na mapie')).toBeInTheDocument()

  act(() => useEditorStore.getState().select([ids[0]]))
  expect(screen.getByText('Warstwa: Warstwa 1')).toBeInTheDocument()
  expect(screen.getByLabelText('X')).toHaveValue(100)
  expect(screen.getByLabelText('Szerokość')).toHaveValue(64)
  expect(screen.getByLabelText('Skala X')).toHaveValue(1)

  act(() => useEditorStore.getState().select(ids))
  expect(screen.getByText('Zaznaczone obiekty: 2')).toBeInTheDocument()
})
