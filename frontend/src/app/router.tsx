import { createBrowserRouter } from 'react-router'
import type { RouteObject } from 'react-router'
import HomePage from '@/pages/HomePage'
import MapEditorPage from '@/pages/MapEditorPage'
import CharacterCreatorPage from '@/pages/CharacterCreatorPage'
import ProjectsPage from '@/pages/ProjectsPage'
import DevUiPage from '@/pages/DevUiPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { AppLayout } from './AppLayout'

// Wszystkie trasy aplikacji w jednym miejscu. Nowa podstrona = nowy wpis tutaj.
// Tablica jest osobno, żeby testy mogły użyć jej z createMemoryRouter.
// Wszystkie podstrony są dziećmi AppLayout, więc mają wspólny nagłówek i stopkę.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/map', element: <MapEditorPage /> },
      { path: '/character', element: <CharacterCreatorPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/dev/ui', element: <DevUiPage /> },
      // '*' musi być ostatni: łapie każdy adres, który nie pasuje do tras powyżej.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
