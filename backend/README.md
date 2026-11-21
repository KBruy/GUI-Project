# Backend

REST API WorldSmith (FastAPI): walidacja scen, projekty, import/eksport, serwowanie PNG assetów.

- `src/` – aplikacja FastAPI (Franek)
- `src/db/` – warstwa bazy danych (Cyprian)
- `tests/` – testy (pytest)

## Uruchomienie (Python 3.12, Docker Desktop)

Serwer zapisuje projekty i czyta assety z PostgreSQL, więc przed startem musi działać baza.

1. Baza (z głównego folderu repozytorium; szczegóły w `src/db/README.md`):
   ```
   copy .env.example .env        # macOS / Linux: cp .env.example .env (tylko za pierwszym razem)
   docker compose up -d
   ```
2. Środowisko Pythona (z folderu `backend/`, tylko za pierwszym razem):
   ```
   py -3.12 -m venv .venv        # macOS / Linux: python3.12 -m venv .venv
   .venv\Scripts\activate        # macOS / Linux: source .venv/bin/activate
   pip install -r requirements-dev.txt
   copy .env.example .env        # macOS / Linux: cp .env.example .env
   ```
3. Tabele i assety (z folderu `backend/`; po każdym `git pull` ze zmianą migracji lub `assets/manifest.json`):
   ```
   alembic upgrade head
   python -m src.db.seed
   ```
4. Serwer (z folderu `backend/`):
   ```
   uvicorn src.main:app --reload --port 8000 --env-file .env
   ```

- Dokumentacja API: http://localhost:8000/docs
- Sprawdzenie serwera: http://localhost:8000/api/health → `{"ok": true}`
- Bez działającej bazy serwer startuje, ale zapytania o assety i projekty kończą się błędem `500 SERVER_ERROR`.

## Testy

```
pytest
```

Testy endpointów działają na repozytoriach w pamięci (`src/dev/`), więc nie potrzebują bazy.
Testy bazy (`test_db_repos.py`, migracje, seed, repozytoria) tworzą osobne bazy `*_test`; bez `docker compose up -d` są pomijane.

CI (`.github/workflows/backend.yml`) uruchamia `pytest` przy każdym PR zmieniającym `backend/`.

## Zmienne środowiskowe (`.env`, wzór w `.env.example`)

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `CLIENT_ORIGIN` | `http://localhost:5173` | adresy frontendu dopuszczone przez CORS (kilka po przecinku) |
| `DATABASE_URL` | `postgresql+psycopg://worldsmith:worldsmith@localhost:5432/worldsmith` | adres bazy; zmienić tylko przy innym porcie lub haśle (`src/db/README.md`) |

Plik `.env` jest wczytywany tylko przy uruchomieniu Uvicorna z flagą `--env-file .env`; bez niej obowiązują wartości domyślne (lub zmienne ustawione w systemie).
