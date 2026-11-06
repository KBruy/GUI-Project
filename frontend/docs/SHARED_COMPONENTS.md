# Komponenty shared

Komponenty wielokrotnego użytku z `src/shared/components/`. **Zmiana w komponencie shared wpływa na całą aplikację** — przed edycją sprawdź, gdzie jest używany, i obejrzyj go na `/dev/ui`.

---

## Zasady

- **Folder na komponent** w `ui/`: `ui/Button/Button.tsx` + `Button.module.css` + `Button.test.tsx`. Komponenty układu są razem w `layout/Layout.tsx`.
- **Bez `index.ts`** — importujemy bezpośrednio: `import { Button } from '@/shared/components/ui/Button/Button'`.
- **Gotowy tekst, nie klucz** — komponenty shared nie importują i18n. Strona robi `t('...')` i podaje wynik w propsie (`label`, `children`). Wyjątek (planowany): Toast.
- **Natywne propsy przechodzą dalej** — np. `Button` przyjmuje wszystko, co `<button>` (`onClick`, `disabled`, `aria-*`, `className`).
- **Stan wizualny przez atrybuty**, nie osobne klasy: `[aria-pressed='true']`, `:disabled`.
- **W CSS tylko tokeny** z `shared/styles/theme.css` (`--space-*`, `--color-*`, `--pixel-border`, `--pixel-shadow`). Bez `border-radius`.
- **Strony nie mają własnego CSS** — składają się z komponentów shared.
- **Testy tylko tam, gdzie jest logika** (kliknięcie, aria, wywołanie callbacka).
- **Nowy komponent = nowa sekcja na `/dev/ui`** (`src/pages/DevUiPage.tsx`) we wszystkich wariantach.

---

## Button

```tsx
<Button variant="primary" size="lg" icon="Download" onClick={save}>
  {t('actions.save')}
</Button>
```

| Prop      | Wartości                                                 | Domyślnie     |
| --------- | -------------------------------------------------------- | ------------- |
| `variant` | `primary` \| `secondary` \| `danger` \| `ghost`          | `secondary`   |
| `size`    | `sm` \| `md` \| `lg`                                     | `md`          |
| `icon`    | nazwa ikony (`IconName`)                                 | —             |
| `pressed` | `boolean` — przycisk przełącznik, ustawia `aria-pressed` | brak atrybutu |

`type="button"` jest domyślne (przycisk nie wysyła formularza przypadkiem). Wyłączony ma przerywaną ramkę, więc różni się kształtem, nie tylko kolorem.

## IconButton

Przycisk z samą ikoną. Owija `Button`, więc ma te same warianty, rozmiary i `pressed`.

```tsx
<IconButton icon="Trash" label={t('actions.delete')} variant="danger" />
```

`label` jest wymagany — trafia do `aria-label` i `title` (później Tooltip, F-17).

## SegmentedControl

Wybór jednej opcji z kilku (motyw, język, narzędzie). Rząd `Button` z `pressed`, w grupie `role="group"`.

```tsx
<SegmentedControl
  options={[
    { value: 'dark', label: t('theme.dark') },
    { value: 'light', label: t('theme.light') },
  ]}
  value={theme}
  onChange={setTheme}
  label={t('theme.label')}
/>
```

Opcja może mieć `icon`. `size` jak w Button. Typ `value` wynika z `options`, więc `onChange={setTheme}` nie wymaga rzutowania.

---

## Layout (`layout/Layout.tsx`)

```tsx
<Container>
  <Stack gap={5}>
    <Panel title="Warstwy">
      <Stack direction="row" gap={2} wrap>
        …
      </Stack>
    </Panel>
  </Stack>
</Container>
```

| Komponent   | Do czego                                             | Propsy                                                                          |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Container` | wyśrodkowana treść strony, max 1280 px, z paddingiem | natywne `div`                                                                   |
| `Stack`     | flex w kolumnie lub rzędzie                          | `direction` (`column`), `gap` 1–6 = `--space-N` (3), `align`, `justify`, `wrap` |
| `Panel`     | ramka z tłem (`section`)                             | `title` → `h2`                                                                  |
| `Toolbar`   | pasek przycisków                                     | `label` (wymagany, `aria-label`)                                                |
| `Sidebar`   | boczny panel (`aside`)                               | `width`, `side` (`left`/`right` — ramka od strony treści)                       |

---

## Ikony

Opis komponentu `Icon` i dodawania nowych ikon: [`STYLES.md`](STYLES.md#ikony-sharedcomponentsuiiconicontsx). Licencja ikon Pxlkit wymaga widocznej atrybucji — jest w `src/app/AppFooter.tsx`, nie usuwać.
