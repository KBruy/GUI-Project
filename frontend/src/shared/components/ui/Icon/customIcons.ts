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

// Narzędzie „Prostokąt”: prostokąt wypełniony polami.
export const RectFill = {
  name: 'rect-fill',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    'OOOOOOOOOOOOOOOO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OLLLLLLLLLLLLLLO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OLLLLLLLLLLLLLLO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OGGGGLGGGGLGGGGO',
    'OOOOOOOOOOOOOOOO',
  ],
  palette: { O: '#333333', L: '#4F8A33', G: '#7EC850' },
  tags: ['rectangle', 'fill'],
}

// Panel warstw: warstwa widoczna (kliknięcie ją ukrywa).
export const Eye = {
  name: 'eye',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    '................',
    '................',
    '................',
    '.....GGGGGG.....',
    '...GG......GG...',
    '..G....GG....G..',
    '.G....GGGG....G.',
    'G.....GGGG.....G',
    '.G....GGGG....G.',
    '..G....GG....G..',
    '...GG......GG...',
    '.....GGGGGG.....',
    '................',
    '................',
    '................',
    '................',
  ],
  palette: { G: '#AAAAAA' },
  tags: ['eye', 'visible'],
}

// Panel warstw: warstwa ukryta (kliknięcie ją pokazuje).
export const EyeClosed = {
  name: 'eye-closed',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    'G..............G',
    '.G............G.',
    '..GG........GG..',
    '....GGGGGGGG....',
    '...G..G..G..G...',
    '..G...G..G...G..',
    '................',
    '................',
    '................',
    '................',
  ],
  palette: { G: '#AAAAAA' },
  tags: ['eye', 'hidden'],
}

// Panel warstw: przesuń warstwę wyżej.
export const ArrowUp = {
  name: 'arrow-up',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    '................',
    '................',
    '.......GG.......',
    '......GGGG......',
    '.....GGGGGG.....',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '................',
    '................',
    '................',
  ],
  palette: { G: '#AAAAAA' },
  tags: ['arrow', 'up'],
}

// Panel warstw: przesuń warstwę niżej.
export const ArrowDown = {
  name: 'arrow-down',
  size: 16 as const,
  category: 'worldsmith',
  grid: [
    '................',
    '................',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '......GGGG......',
    '...GGGGGGGGGG...',
    '....GGGGGGGG....',
    '.....GGGGGG.....',
    '......GGGG......',
    '.......GG.......',
    '................',
    '................',
    '................',
  ],
  palette: { G: '#AAAAAA' },
  tags: ['arrow', 'down'],
}
