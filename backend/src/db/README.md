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
