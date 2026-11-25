import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { createMapScene, MAP_SIZES } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import { LayersPanel } from './LayersPanel'

it('adds a layer on top, hides it and moves it down', () => {
  act(() => useEditorStore.getState().loadScene(createMapScene('Test', MAP_SIZES[0], 'Warstwa 1')))
  render(
    <LanguageProvider>
      <LayersPanel />
    </LanguageProvider>
  )
  const rows = () => screen.getAllByRole('listitem')

  fireEvent.click(screen.getByRole('button', { name: 'Dodaj warstwę' }))
  // Nowa warstwa jest na górze listy i od razu aktywna.
  expect(rows().map((row) => row.textContent)).toEqual(['Warstwa 2', 'Warstwa 1'])
  expect(within(rows()[0]).getByRole('button', { name: 'Warstwa 2' })).toHaveAttribute(
    'aria-current',
    'true'
  )

  fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Ukryj warstwę' }))
  expect(useEditorStore.getState().scene?.layers[1].visible).toBe(false)

  fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Przesuń niżej' }))
  expect(rows().map((row) => row.textContent)).toEqual(['Warstwa 1', 'Warstwa 2'])
})
