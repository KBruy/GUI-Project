# Konfiguracja frontendu

Przewodnik dla zespołu – jak uruchomić frontend, jakie narzędzia są skonfigurowane i dlaczego.

---

## Pierwsze uruchomienie

```bash
# w katalogu głównym repo:
cp frontend/.env.example frontend/.env
npm install
npm run dev --workspace=frontend
```

Aplikacja startuje na `http://localhost:5173`.

---

## Zmienne środowiskowe

Plik `frontend/.env` nie jest commitowany do repo (jest w `.gitignore`). Wzorzec dostępny w `frontend/.env.example`.

| Zmienna | Domyślna wartość | Opis |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Adres backendu REST API |

> **Ważne:** Backend (Franek) domyślnie nasłuchuje na porcie **8000**. Baza danych PostgreSQL (Cyprian) nasłuchuje na porcie **5432** – frontend łączy się tylko z backendem, nie z bazą bezpośrednio.

Zmienna jest odczytywana w jednym miejscu: `src/config/env.ts`. Nigdzie w kodzie nie hardcodujemy adresu API.

---

## Skrypty npm

Uruchamianie z katalogu `frontend/` lub z korzenia repo z flagą `--workspace=frontend`.

| Skrypt | Co robi |
|---|---|
| `npm run dev` | Dev server z HMR na `localhost:5173` |
| `npm run build` | Sprawdza typy (`tsc -b`) i buduje do `dist/` |
| `npm run typecheck` | Tylko sprawdzenie typów, bez budowania |
| `npm run lint` | ESLint na całym `src/` |
| `npm run format` | Prettier formatuje `src/` |
| `npm run test` | Vitest uruchamia wszystkie testy jednorazowo |
| `npm run test:watch` | Vitest w trybie watch (na bieżąco przy developmencie) |

---

## TypeScript

Konfiguracja podzielona na trzy pliki:

- `tsconfig.json` – korzeń projektu referencyjnego, sam wskazuje na dwa poniżej
- `tsconfig.app.json` – kod aplikacji w `src/`, tryb **strict**, `moduleResolution: bundler`
- `tsconfig.node.json` – pliki konfiguracyjne Vite

Włączony tryb `strict` oznacza m.in.: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`. Kompilator TypeScript nie emituje plików JS – to robi Vite.

### Aliasy importów

Zamiast ścieżek relatywnych (`../../../`) używamy aliasu `@/`:

```ts
import { API_URL } from '@/config/env.ts'
import { Button } from '@/shared/components/ui/Button.tsx'
```

Alias `@/*` → `src/*` jest skonfigurowany w `tsconfig.app.json` (pole `paths`) i w `vite.config.ts` (pole `resolve.alias`).

---

## Linting i formatowanie

### ESLint

Plik konfiguracyjny: `frontend/eslint.config.js` (format flat config, ESLint 10).

Aktywne zestawy reguł:
- `@eslint/js` – reguły bazowe JS
- `typescript-eslint` – reguły TypeScript (zalecane)
- `eslint-plugin-react-hooks` – reguły hooków Reacta
- `eslint-plugin-react-refresh` – ostrzeżenia dla Vite HMR
- `eslint-config-prettier` – wyłącza reguły ESLint kolidujące z Prettier

### Prettier

Plik konfiguracyjny: `frontend/.prettierrc`.

| Opcja | Wartość |
|---|---|
| `semi` | `false` (brak średników) |
| `singleQuote` | `true` |
| `tabWidth` | `2` |
| `trailingComma` | `es5` |
| `printWidth` | `100` |

VS Code formatuje automatycznie przy zapisie – konfiguracja w `.vscode/settings.json`.

---

## Testy

Framework: **Vitest 5** + **Testing Library 16**.

- Środowisko: `jsdom` (symulacja przeglądarki w Node)
- Setup: `src/test/setup.ts` rejestruje matchery `@testing-library/jest-dom`
- Pliki testowe: `*.test.tsx` / `*.test.ts` obok testowanego kodu

Przykładowy test: `src/app/App.test.tsx`.
