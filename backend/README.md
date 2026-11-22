# Backend

REST API WorldSmith (FastAPI): walidacja scen, projekty, import/eksport, serwowanie PNG assetów.

- `src/` – aplikacja FastAPI
- `src/db/` – warstwa bazy danych
- `tests/` – testy (pytest)

## Dokumentacja

- [API](../docs/backend/API.md) – endpointy, przykłady zapytań i odpowiedzi, format sceny
- [Błędy](../docs/backend/ERRORS.md) – kody błędów i klucze tłumaczeń dla frontendu
- [Architektura](../docs/backend/ARCHITECTURE.md) – budowa backendu, poziomy walidacji,
  [dopisanie nowej reguły walidacji](../docs/backend/ARCHITECTURE.md#nowa-reguła-walidacji)
- [Baza danych](src/db/README.md) – tabele, migracje, seed

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
   W każdym nowym terminalu przed kolejnymi krokami trzeba aktywować `.venv` (druga linia).
   `pip install -r requirements-dev.txt` powtórzyć po każdym `git pull` ze zmianą `requirements*.txt`.
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

## Częste problemy

| Objaw | Przyczyna i rozwiązanie |
|---|---|
| assety i projekty zwracają `500 SERVER_ERROR` | baza nie działa: `docker compose up -d` (z głównego folderu repozytorium), potem `docker compose ps` |
| baza działa, a połączenie i tak się nie udaje | port 5432 zajmuje PostgreSQL zainstalowany w systemie: zatrzymać tę usługę albo zmienić port bazy (`src/db/README.md`) |
| `relation "..." does not exist` w logach serwera | brak tabel: `alembic upgrade head` |
| pusta lista assetów | brak assetów w bazie: `python -m src.db.seed` |
| przeglądarka blokuje zapytania (błąd CORS w konsoli) | frontend działa pod innym adresem niż `CLIENT_ORIGIN` (Vite przy zajętym porcie 5173 wybiera 5174); dopisać ten adres w `.env` i uruchomić serwer ponownie |
| `ModuleNotFoundError` przy starcie | nieaktywne `.venv` albo nieaktualne zależności: aktywować `.venv` i `pip install -r requirements-dev.txt` |
