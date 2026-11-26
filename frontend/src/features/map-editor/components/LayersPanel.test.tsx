import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { addObject, createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { LayersPanel } from './LayersPanel'

it('adds a layer on top, hides it and reorders it with arrows and dragging', () => {
  act(() => useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1')))
  render(
    <LanguageProvider>
      <LayersPanel />
    </LanguageProvider>
  )
  const rows = () => screen.getAllByRole('listitem')
  // Nazwy warstw w kolejności z panelu (bez liczby obiektów).
  const names = () => rows().map((row) => within(row).getAllByRole('button')[0].textContent)

  fireEvent.click(screen.getByRole('button', { name: 'Dodaj warstwę' }))
  // Nowa warstwa jest na górze listy i od razu aktywna.
  expect(names()).toEqual(['Warstwa 2', 'Warstwa 1'])
  expect(within(rows()[0]).getByRole('button', { name: 'Warstwa 2' })).toHaveAttribute(
    'aria-current',
    'true'
  )

  fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Ukryj warstwę' }))
  expect(useEditorStore.getState().scene?.layers[1].visible).toBe(false)

  fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Przesuń niżej' }))
  expect(names()).toEqual(['Warstwa 1', 'Warstwa 2'])

  // Przeciągnięcie dolnego wiersza nad górny przywraca kolejność.
  const dataTransfer = { setData: () => {}, effectAllowed: '' }
  fireEvent.dragStart(rows()[1], { dataTransfer })
  // jsdom nie zna DragEvent, więc clientY ustawiamy ręcznie (nad środkiem wiersza)
  const over = createEvent.dragOver(rows()[0], { dataTransfer })
  Object.defineProperty(over, 'clientY', { value: -1 })
  fireEvent(rows()[0], over)
  fireEvent.drop(rows()[0], { dataTransfer })
  expect(names()).toEqual(['Warstwa 2', 'Warstwa 1'])
})

it('renames a layer on double-click and asks before deleting a layer with objects', () => {
  act(() => {
    useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1'))
    useEditorStore.getState().addLayer('Drzewa')
    const store = useEditorStore.getState()
    store.execute(
      addObject(store.activeLayerId!, { id: 'tree', width: 32, height: 32 }, { x: 50, y: 50 })
    )
  })
  render(
    <LanguageProvider>
      <LayersPanel />
    </LanguageProvider>
  )

  fireEvent.doubleClick(screen.getByRole('button', { name: 'Drzewa' }))
  const input = screen.getByRole('textbox', { name: 'Nazwa warstwy' })
  fireEvent.change(input, { target: { value: 'Las' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByRole('button', { name: 'Las' })).toBeInTheDocument()

  // Warstwa ma obiekt, więc usunięcie czeka na potwierdzenie w oknie.
  fireEvent.click(screen.getByRole('button', { name: 'Usuń warstwę' }))
  expect(useEditorStore.getState().scene?.layers).toHaveLength(2)
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usuń warstwę' }))
  expect(useEditorStore.getState().scene?.layers.map((l) => l.name)).toEqual(['Warstwa 1'])
})
