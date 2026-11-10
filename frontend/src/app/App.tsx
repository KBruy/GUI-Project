import { RouterProvider } from 'react-router'
import { AppFooter } from './AppFooter'
import { router } from './router'

// TODO F-21: AppFooter przenieść do AppLayout razem z nawigacją.
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <AppFooter />
    </>
  )
}

export default App
