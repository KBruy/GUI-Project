# WorldSmith

Kreator postaci i map w stylu pixel art.

| Folder | Sektor | Właściciel |
|---|---|---|
| `frontend/` | React + TypeScript | Krystian |
| `backend/` | REST API | Franek |
| `backend/src/db/` | Baza danych (PostgreSQL) | Cyprian |
| `engine/` | Silnik edytora (`@worldsmith/engine`) | Kuba |
| `assets/` | Rysunki / sprite’y | Monika |
| `docs/` | Dokumentacja projektowa | — |

---

## Wymagania

- **Node.js** 22.22.2+ albo 24 LTS ([nodejs.org](https://nodejs.org))
- **Docker Desktop** (do bazy danych)

---

## Pierwsze uruchomienie

```bash
# 1. Zainstaluj zależności (wystarczy raz, z katalogu głównego)
npm install

# 2. Skopiuj plik z ustawieniami frontendu
cp frontend/.env.example frontend/.env

# 3. Uruchom bazę danych
cp .env.example .env
docker compose up -d
```

---

## Uruchamianie frontendu (React)

```bash
npm run dev
```

Aplikacja startuje na **http://localhost:5173** i odświeża się automatycznie przy każdej zmianie pliku (HMR).

> Jeśli port 5173 jest zajęty, Vite sam wybierze następny wolny port i wypisze go w terminalu.

---

## Uruchamianie bazy danych

```bash
docker compose up -d        # uruchom w tle
docker compose ps           # sprawdź czy działa (STATUS: Up)
docker compose stop         # zatrzymaj (dane zostają)
docker compose down -v      # reset – usuwa kontener i dane
```

Dane połączenia (domyślne): `localhost:5432`, użytkownik / hasło / baza: `worldsmith`.

Szczegóły: [`backend/src/db/README.md`](backend/src/db/README.md)

---

## Inne skrypty frontendu

| Skrypt | Co robi |
|---|---|
| `npm test` | Uruchamia testy jednostkowe |
| `npm run build` | Buduje produkcyjną wersję do `frontend/dist/` |
| `npm run lint` | Sprawdza styl kodu (ESLint) |
| `npm run typecheck` | Sprawdza typy TypeScript |

Wszystkie skrypty działają z katalogu głównego repo.

---

## Licencje i atrybucja

Ikony pixel-art (`@pxlkit/ui`, `@pxlkit/feedback`) stworzone przez [Joangel De La Rosa](https://github.com/joangeldelarosa) — używane zgodnie z [Pxlkit Asset License](https://github.com/Joangeldelarosa/pxlkit/blob/main/LICENSE-ASSETS) (free with attribution).
