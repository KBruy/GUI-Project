# Frontend

React (bulletproof-react). Właściciel: Krystian.

CI sprawdza: `lint` + `typecheck` + `test` przy każdym PR dotykającym `frontend/` lub `engine/`.

- `docs/` – dokumentacja techniczna frontendu (kontekst dla AI)
- `docs/plan/TASKS.md` – plan tasków frontendu
- `src/` – kod (CSS Modules + zmienne CSS, ikony pxlkit)

## Zmienne środowiskowe

Skopiuj `.env.example` do `.env` przed pierwszym uruchomieniem:

```
cp .env.example .env
```

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Adres backendu |
