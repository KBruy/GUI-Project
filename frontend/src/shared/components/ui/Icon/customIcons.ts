// Własne ikony w formacie Pxlkit (siatka 16×16 i paleta kolorów), gdy w paczkach Pxlkit brakuje
// pasującej. Każdą trzeba też dopisać do listy ikon w Icon.tsx. Bez importu z @pxlkit (ESLint
// pozwala na niego tylko w Icon.tsx): typ sprawdza Icon.tsx przy przekazaniu do PxlKitIcon.

// Kursor narzędzia „Zaznaczanie”.
export const Cursor = {
  name: 'cursor',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    '................',
    '.O..............',
    '.OO.............',
    '.OWO............',
    '.OWWO...........',
    '.OWWWO..........',
    '.OWWWWO.........',
    '.OWWWWWO........',
    '.OWWWWWWO.......',
    '.OWWWWWWWO......',
    '.OWWWWWOOOO.....',
    '.OWWOWWO........',
    '.OWO.OWWO.......',
    '.OO..OWWO.......',
    '.O....OWWO......',
    '.......OO.......',
  ],
  palette: { O: '#333333', W: '#FFFFFF' },
  tags: ['cursor', 'select'],
}
