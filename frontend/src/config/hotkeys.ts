// Wszystkie skróty klawiszowe edytora map (F-37). Zmiana klawisza to zmiana tylko w tym pliku.

// Jedna kombinacja klawiszy. key to event.key małymi literami ('z', 'arrowleft', '+', ' ').
// ctrl oznacza Ctrl albo Cmd na Macu.
export interface KeyCombo {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

const ARROWS = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown']

export const HOTKEYS = {
  undo: [{ key: 'z', ctrl: true }],
  redo: [
    { key: 'z', ctrl: true, shift: true },
    { key: 'y', ctrl: true },
  ],
  save: [{ key: 's', ctrl: true }],
  // Backspace, bo na Macu nie ma osobnego klawisza Delete.
  delete: [{ key: 'delete' }, { key: 'backspace' }],
  cancel: [{ key: 'escape' }],
  toolSelect: [{ key: 'v' }],
  toolBrush: [{ key: 'b' }],
  toolRect: [{ key: 'r' }],
  toolFill: [{ key: 'g' }],
  toolEraser: [{ key: 'e' }],
  // Przesuwanie zaznaczonych. Kolejność kombinacji: w lewo, w prawo, w górę, w dół.
  nudge: ARROWS.map((key) => ({ key })),
  nudgeFar: ARROWS.map((key) => ({ key, shift: true })),
  zoomIn: [{ key: '+' }, { key: '=' }],
  zoomOut: [{ key: '-' }],
  // Przytrzymana spacja + przeciąganie przesuwa widok.
  pan: [{ key: ' ' }],
} satisfies Record<string, KeyCombo[]>

export type HotkeyAction = keyof typeof HOTKEYS

// Która kombinacja akcji pasuje do zdarzenia (-1, gdy żadna). Ctrl, Alt i Shift muszą się zgadzać,
// poza Shiftem przy znakach jak + albo ?, bo to, czy trzeba go wcisnąć, zależy od układu klawiatury.
export function hotkeyIndex(event: KeyboardEvent, action: HotkeyAction): number {
  const key = event.key.toLowerCase()
  const symbol = key.length === 1 && key === key.toUpperCase()
  return (HOTKEYS[action] as KeyCombo[]).findIndex(
    (combo) =>
      combo.key === key &&
      !!combo.ctrl === (event.ctrlKey || event.metaKey) &&
      !!combo.alt === event.altKey &&
      (symbol || !!combo.shift === event.shiftKey)
  )
}

export function isHotkey(event: KeyboardEvent, action: HotkeyAction): boolean {
  return hotkeyIndex(event, action) !== -1
}
