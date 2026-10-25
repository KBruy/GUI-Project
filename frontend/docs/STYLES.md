# Style i design system

Jak używać tokenów CSS, motywów, animacji i ikon w komponentach.

---

## Tokeny CSS (`shared/styles/theme.css`)

Wszystkie wartości wizualne żyją jako zmienne CSS w `:root`. Nigdy nie hardcoduj kolorów, odstępów ani fontów bezpośrednio w komponentach — używaj tokenów.

### Kolory

```css
color: var(--color-text);
background: var(--color-surface);
border: var(--pixel-border);          /* shorthand: width + solid + color-border */
box-shadow: var(--pixel-shadow);      /* hard pixel drop-shadow */
```

| Token | Zastosowanie |
|---|---|
| `--color-bg` | Tło strony |
| `--color-surface` | Karta, panel |
| `--color-surface-raised` | Element uniesiony (dropdown, modal) |
| `--color-border` | Obramowanie |
| `--color-shadow` | Twardy cień pixel-art |
| `--color-text` | Tekst podstawowy |
| `--color-text-muted` | Tekst drugorzędny, placeholder |
| `--color-primary` | Akcja główna (przyciski, linki) |
| `--color-on-primary` | Tekst na tle primary |
| `--color-accent` | Akcent, wyróżnienie |
| `--color-on-accent` | Tekst na tle accent |
| `--color-danger` | Ostrzeżenie, akcja destrukcyjna |
| `--color-on-danger` | Tekst na tle danger |
| `--color-focus` | Ring fokusu (dostępność) |

### Odstępy

Skala 4 px: `--space-1` (4 px) … `--space-6` (32 px).

```css
padding: var(--space-2) var(--space-4);
gap: var(--space-3);
```

### Fonty

```css
font-family: var(--font-heading);   /* Press Start 2P — nagłówki */
font-family: var(--font-body);      /* VT323 — tekst, 20 px+ dla czytelności */
font-size: var(--font-size-lg);     /* sm / md / lg / xl */
```

### Obramowania i szerokości

```css
border: var(--pixel-border);         /* var(--border-width) solid var(--color-border) */
outline: var(--focus-width) solid var(--color-focus);
```

W motywie kontrastowym `--border-width` i `--focus-width` rosną do 4 px automatycznie.

---

## Motywy

Trzy motywy: `dark` (domyślny), `light`, `contrast`.

### Jak działa zmiana motywu

Atrybut `data-theme` na `<html>` aktywuje odpowiedni blok w `theme.css`. Wszystkie tokeny kolorów są nadpisywane — reszta komponentu nie wie, że motyw się zmienił.

```
<html data-theme="light">
```

### Jak użyć motywu w komponencie

```tsx
import { useTheme } from '@/shared/theme/theme'

function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('contrast')}>
      Aktywny motyw: {theme}
    </button>
  )
}
```

`setTheme` aktualizuje `data-theme` na `<html>` i zapisuje wybór w `localStorage` — po odświeżeniu strony motyw zostaje.

### Jak dodać nowy motyw

1. Dopisz wartość do `THEMES` w `src/shared/theme/theme.ts`.
2. Dodaj blok `[data-theme='twoj-motyw']` w `src/shared/styles/theme.css` — nadpisz wszystkie tokeny kolorów.

---

## Animacje (`shared/animations/animations.module.css`)

> **TODO F-14** — ten plik zostanie utworzony w tasku F-14.

Planowane klasy: `hoverLift`, `fadeIn`, `shake`. Używają `steps()` dla klatkowego efektu pixel-art. Przy `prefers-reduced-motion: reduce` animacje są wyłączone.

---

## Ikony (`shared/components/ui/Icon.tsx`)

> **TODO F-13** — komponent zostanie utworzony w tasku F-13.

Planowane: komponent `Icon` oparty na `@pxlkit/core`. Poza `Icon.tsx` nie importuj niczego z `@pxlkit` bezpośrednio — pilnuje tego reguła ESLint.
