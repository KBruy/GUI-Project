import { createBrowserRouter } from 'react-router'
import type { RouteObject } from 'react-router'
import HomePage from '@/pages/HomePage'
import MapEditorPage from '@/pages/MapEditorPage'
import CharacterCreatorPage from '@/pages/CharacterCreatorPage'
import ProjectsPage from '@/pages/ProjectsPage'
import DevUiPage from '@/pages/DevUiPage'

// Wszystkie trasy aplikacji w jednym miejscu. Nowa podstrona = nowy wpis tutaj.
// Tablica jest osobno, żeby testy mogły użyć jej z createMemoryRouter.
export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/map', element: <MapEditorPage /> },
  { path: '/character', element: <CharacterCreatorPage /> },
  { path: '/projects', element: <ProjectsPage /> },
  { path: '/dev/ui', element: <DevUiPage /> },
]

export const router = createBrowserRouter(routes)
