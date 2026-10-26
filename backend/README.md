# Backend

REST API WorldSmith (FastAPI): walidacja scen, projekty, import/eksport, serwowanie PNG assetów.

- `src/` – aplikacja FastAPI (Franek)
- `src/db/` – warstwa bazy danych (Cyprian)
- `tests/` – testy (pytest)

## Uruchomienie (z folderu `backend/`, Python 3.12)

Windows:
```
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env
uvicorn src.main:app --reload --port 8000 --env-file .env
```

Linux / macOS: `python3.12 -m venv .venv`, `source .venv/bin/activate`, `cp .env.example .env`, reszta bez zmian.

- Dokumentacja API: http://localhost:8000/docs
- Sprawdzenie serwera: http://localhost:8000/api/health → `{"ok": true}`

## Testy

```
pytest
```

CI (`.github/workflows/backend.yml`) uruchamia `pytest` przy każdym PR zmieniającym `backend/`.

## Zmienne środowiskowe (`.env`, wzór w `.env.example`)

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `CLIENT_ORIGIN` | `http://localhost:5173` | adresy frontendu dopuszczone przez CORS (kilka po przecinku) |

Plik `.env` jest wczytywany tylko przy uruchomieniu Uvicorna z flagą `--env-file .env`; bez niej obowiązują wartości domyślne (lub zmienne ustawione w systemie).
