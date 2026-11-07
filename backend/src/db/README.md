# Baza danych
## Uruchomienie bazy danych

Wymagania: zainstalowany i uruchomiony Docker Desktop.

1. Skopiuj plik z ustawieniami (tylko za pierwszym razem):
```
   copy .env.example .env
```
2. Uruchom bazę:
```
   docker compose up -d
```
3. Sprawdź, czy działa (STATUS powinien być `Up`):
```
   docker compose ps
```

Dane połączenia są w pliku `.env` (domyślnie `localhost:5432`, użytkownik, hasło i baza: `worldsmith`).

Połączenie z konsolą bazy:
```
docker compose exec db psql -U worldsmith -d worldsmith
```

| Komenda | Co robi |
|---|---|
| `docker compose stop` | zatrzymuje bazę, dane zostają |
| `docker compose down` | usuwa kontener, dane zostają |
| `docker compose down -v` | usuwa kontener **razem z danymi** (reset bazy) |
| `docker compose logs db` | pokazuje logi bazy |

Jeśli port 5432 jest zajęty (np. przez zainstalowany PostgreSQL), ustaw w `.env` `POSTGRES_PORT=5433`.
Backend i Alembic nie czytają `.env` same, więc ustaw też adres bazy w terminalu (PowerShell):
```
$env:DATABASE_URL="postgresql+psycopg://worldsmith:worldsmith@localhost:5433/worldsmith"
```

## Tabele

Modele są w `src/db/models.py`. Tabele tworzy migracja Alembica, a nie `create_all`.

| Tabela | Kolumny | Ograniczenia |
|---|---|---|
| `asset_categories` | `id`, `key`, `module`, `name_key`, `sort_order` | `key` unikalny; `module` tylko `map` albo `character` |
| `assets` | `id` (tekst, np. `map_tree_oak_01`), `category_id`, `name_key`, `file_path`, `width`, `height`, `created_at` | `category_id` → `asset_categories.id`, nie da się usunąć kategorii, która ma assety; `width` i `height` > 0 |
| `projects` | `id` (UUID), `type`, `name`, `scene` (JSONB), `schema_version`, `created_at`, `updated_at` | `type` tylko `map` albo `character`; indeks `(type, updated_at DESC)` pod listę projektów |

Dozwolone moduły muszą się zgadzać z `Module` w `src/schemas/base.py`; pilnuje tego `tests/test_models.py`.

`id`, `created_at` i `updated_at` projektu nadaje backend (`services/projects.py`) i te same wartości zapisuje w scenie.
Dlatego `updated_at` nie zmienia się w bazie samo przy zapisie.

## Migracje (Alembic)

Migracja to plik w `migrations/versions/`, który opisuje zmianę schematu (`upgrade`) i jej cofnięcie (`downgrade`).
Alembic zapisuje w tabeli `alembic_version`, która migracja jest ostatnio wykonana.

Komendy uruchamiaj z folderu `backend/`, z aktywnym venv i działającą bazą.
`python -m alembic` gwarantuje, że alembic uruchomi się z Pythona z venv.

| Komenda | Co robi |
|---|---|
| `python -m alembic upgrade head` | tworzy lub aktualizuje tabele do najnowszej wersji |
| `python -m alembic current` | pokazuje wersję schematu w bazie |
| `python -m alembic downgrade -1` | cofa ostatnią migrację |
| `python -m alembic downgrade base` | cofa wszystkie migracje (**usuwa tabele z danymi**) |
| `python -m alembic check` | sprawdza, czy modele nie różnią się od migracji (to samo robi CI) |

Po sklonowaniu repo albo po pobraniu cudzej migracji wystarczy `python -m alembic upgrade head`.

### Nowa migracja po zmianie `models.py`

```
python -m alembic revision --autogenerate --rev-id 0002 -m "opis zmiany"
```

1. **Przeczytaj wygenerowany plik przed commitem.** Autogenerate to szkic. Nie wykrywa np. zmiany nazwy kolumny,
   bo widzi ją jako usunięcie starej i dodanie nowej, co skasowałoby dane.
2. Sprawdź go na swojej bazie: `upgrade head`, potem `downgrade -1` i znowu `upgrade head`.
3. **Nie edytuj migracji, która jest już na `main`.** Inni mogli ją już wykonać, więc poprawkę zawsze robi się nową migracją.

Adres bazy Alembic bierze z `DATABASE_URL`, tak jak aplikacja (`src/config.py`), więc w `alembic.ini` nie ma hasła.

## Testy bazy

| Plik | Co sprawdza | Wymaga bazy |
|---|---|---|
| `tests/test_db.py` | połączenie z bazą | tak |
| `tests/test_models.py` | nazwy tabel i kolumn, CHECK-i, indeks, klucz obcy (opis w Pythonie) | nie |
| `tests/test_migrations.py` | migracja tworzy to, co opisują modele; `downgrade` i `upgrade` działają; baza odrzuca złe dane | tak |

```
python -m pytest tests\test_models.py tests\test_migrations.py -v
```

`test_migrations.py` tworzy osobną bazę `worldsmith_test` i usuwa ją po testach, więc nie rusza danych w bazie `worldsmith`.
Bez działającej bazy testy z bazą są pomijane (`SKIPPED`). W CI baza działa zawsze, bo `backend.yml` uruchamia kontener PostgreSQL.