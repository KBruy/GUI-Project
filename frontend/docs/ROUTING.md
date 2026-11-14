# Routing i układ strony

Biblioteka: `react-router` (tryb biblioteki, bez generowania tras z plików).

## Trasy (`src/app/router.tsx`)

| Adres        | Strona (`src/pages/`)      | Co tam będzie                 |
| ------------ | -------------------------- | ----------------------------- |
| `/`          | `HomePage.tsx`             | strona startowa               |
| `/map`       | `MapEditorPage.tsx`        | edytor map (F-29 i dalej)     |
| `/character` | `CharacterCreatorPage.tsx` | kreator postaci (F-42)        |
| `/projects`  | `ProjectsPage.tsx`         | lista projektów (F-39)        |
| `/dev/ui`    | `DevUiPage.tsx`            | katalog komponentów shared    |
| `*`          | `NotFoundPage.tsx`         | 404 dla każdego innego adresu |

Wszystkie trasy są dziećmi `AppLayout`, więc każda strona ma ten sam nagłówek i stopkę. Strona `/dev/ui` nie jest w menu, wchodzi się na nią z paska adresu.

## Nowa podstrona

1. Dodaj plik w `src/pages/` (eksport domyślny, tylko gotowe komponenty shared, bez własnego CSS).
2. Dopisz trasę w tablicy `routes` w `router.tsx`, przed `'*'`.
3. Jeśli ma być w menu, dopisz link w `NAV_LINKS` w `src/app/AppLayout.tsx` i klucz tłumaczenia w `dictionary.ts`.

## Układ (`src/app/AppLayout.tsx`)

Nagłówek (logo jako link do `/` i nawigacja), pod nim `<Outlet />` z treścią bieżącej strony, na dole `AppFooter` (atrybucja ikon Pxlkit, nie usuwać). Aktywny link dostaje od `NavLink` atrybut `aria-current="page"` i jest stylowany po nim.

## Testy

`routes` jest eksportowane osobno, żeby testy mogły użyć tych samych tras z `createMemoryRouter` i zacząć od dowolnego adresu (zob. `src/app/App.test.tsx`).
