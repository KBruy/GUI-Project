# API backendu

REST API WorldSmith: biblioteka assetów, projekty map i postaci, import i eksport plików `.worldsmith.json`.
Interaktywna dokumentacja (można z niej wysyłać zapytania) działa pod http://localhost:8000/docs po uruchomieniu serwera
(`backend/README.md`). Błędy i ich kody opisuje [ERRORS.md](ERRORS.md).

## Zasady ogólne

- Adres: `http://localhost:8000` (we frontendzie `VITE_API_URL`). Wszystkie endpointy zaczynają się od `/api`, poza plikami PNG (`/static/assets/...`).
- Treść zapytań i odpowiedzi to JSON (UTF-8). Wyjątek: import przyjmuje formularz `multipart/form-data`, a `DELETE` zwraca pustą odpowiedź.
- CORS: zapytania z przeglądarki są dozwolone tylko z adresów w `CLIENT_ORIGIN` (domyślnie `http://localhost:5173`).
- Ciało zapytania może mieć najwyżej 3 MB, większe → `413 INVALID_FILE`.
- Backend nie zmienia sceny: zapisuje ją w całości i zwraca taką, jaką dostał, zmieniając tylko `id`, `createdAt` i `updatedAt`.
  Kolizje na tej samej warstwie sprawdza tymi samymi wzorami co silnik, więc scena zbudowana w edytorze je przechodzi.
- Liczby wracają jako liczby zmiennoprzecinkowe (`"x": 320.0` zamiast `320`); dla JavaScriptu to ta sama wartość.

## Endpointy

| Metoda | Ścieżka | Działanie | Sukces |
|---|---|---|---|
| GET | `/api/health` | sprawdzenie, czy serwer działa | 200 |
| GET | `/api/assets` | lista assetów, filtry `module`, `category` | 200 |
| GET | `/static/assets/<file>` | plik PNG assetu | 200 |
| GET | `/api/projects` | lista projektów bez scen, filtr `type` | 200 |
| POST | `/api/projects` | nowy projekt | 201 |
| GET | `/api/projects/{id}` | projekt z pełną sceną | 200 |
| PUT | `/api/projects/{id}` | zapis całej sceny projektu | 200 |
| DELETE | `/api/projects/{id}` | usunięcie projektu | 204 |
| GET | `/api/projects/{id}/export` | pobranie projektu jako pliku | 200 |
| POST | `/api/projects/import` | nowy projekt z pliku | 201 |

### `GET /api/health`

Zwraca `{"ok": true}`. Frontend odpytuje go we wskaźniku połączenia w stopce.

### `GET /api/assets?module=map&category=trees`

Oba parametry są opcjonalne. `module` przyjmuje `map` albo `character` (inna wartość → `422 VALIDATION_FAILED`);
nieznana `category` daje pustą listę. Kolejność: po module, potem po kategorii, potem po `id` (alfabetycznie).

```json
[
  {
    "id": "map_building_door_01",
    "module": "map",
    "category": "buildings",
    "nameKey": "assets.map.building_door",
    "file": "map/buildings/map_building_door_01.png",
    "width": 32,
    "height": 64
  }
]
```

- `nameKey`: klucz tłumaczenia nazwy; tekst wyświetla frontend.
- `width`, `height`: rozmiar bazowy w pikselach; obiekt z tego assetu musi mieć dokładnie te wymiary.
- Plik PNG: `GET /static/assets/` + `file`, np. `/static/assets/map/buildings/map_building_door_01.png`.

Assety pochodzą z `assets/manifest.json`, do bazy trafiają przez skrypt seed (`backend/src/db/README.md`).

### `GET /api/projects?type=map`

Lista projektów bez scen, od ostatnio zmienionego (`updatedAt` malejąco). `type` jest opcjonalny (`map` albo `character`).

```json
[
  {
    "id": "21e9794a-540b-4463-a722-12f72587fe6f",
    "type": "map",
    "name": "Wioska",
    "createdAt": "2026-11-21T19:32:24.034998Z",
    "updatedAt": "2026-11-21T19:32:24.034998Z"
  }
]
```

### `POST /api/projects`

Ciało: cała scena (format w sekcji „Scena”). Odpowiedź `201`: zapisana scena z nowym `id` i datami.
Serwer pomija `id`, `createdAt` i `updatedAt` z ciała, ale muszą one być w zapytaniu i mieć poprawny format
(model sceny jest ten sam dla wszystkich endpointów). Frontend wysyła tymczasowe wartości z silnika.

Błędy: zły kształt danych lub scena łamiąca reguły → `422 VALIDATION_FAILED` ze wszystkimi problemami naraz.

### `GET /api/projects/{id}`

Zwraca pełną scenę projektu. Brak projektu → `404 PROJECT_NOT_FOUND`.

### `PUT /api/projects/{id}`

Ciało: cała scena (bez częściowych zmian, także przy autozapisie). Odpowiedź `200`: zapisana scena.
`id` pochodzi z adresu, `createdAt` z zapisanego projektu, `updatedAt` to chwila zapisu; wartości z ciała są pomijane.

Błędy: brak projektu → `404 PROJECT_NOT_FOUND`; zmiana `type` (mapa na postać lub odwrotnie) → `422` z problemem
`INVALID_FIELD`, `field: "type"`; scena łamiąca reguły → `422 VALIDATION_FAILED`.

### `DELETE /api/projects/{id}`

Odpowiedź `204` bez treści. Brak projektu → `404 PROJECT_NOT_FOUND`.

### `GET /api/projects/{id}/export`

Zwraca scenę projektu (ta sama treść co `GET /api/projects/{id}`) z nagłówkiem:

```
Content-Disposition: attachment; filename="Laka-ze-stawem.worldsmith.json"
```

Nazwa pliku powstaje z nazwy projektu: bez polskich znaków, każdy ciąg znaków innych niż litery, cyfry, `_` i `-`
zamienia się w `-` (gdy nic nie zostaje: `projekt.worldsmith.json`). Nagłówek jest udostępniony przez CORS,
więc frontend może odczytać nazwę pliku z odpowiedzi `fetch`.

```
curl -OJ http://localhost:8000/api/projects/<id>/export
```

(`-OJ` zapisuje plik pod nazwą z nagłówka; na Windows w PowerShellu wpisać `curl.exe`.)

### `POST /api/projects/import`

Formularz `multipart/form-data` z polem `file` (plik `.worldsmith.json`, czyli scena w JSON-ie).
Tworzy nowy projekt tak jak `POST /api/projects` (nowe `id` i daty). Odpowiedź `201`: zapisana scena.

```
curl -F "file=@Laka-ze-stawem.worldsmith.json" http://localhost:8000/api/projects/import
```

Błędy, w kolejności sprawdzania:

| Sytuacja | Odpowiedź |
|---|---|
| brak pola `file` | `422 VALIDATION_FAILED`, `INVALID_FIELD` z `field: "file"` |
| plik większy niż 3 MB | `413 INVALID_FILE` |
| plik nie jest JSON-em | `400 INVALID_FILE`, `details: {}` |
| JSON bez kształtu sceny | `400 INVALID_FILE`, w `issues` problemy `INVALID_FIELD` |
| poprawny kształt, ale scena łamie reguły | `422 VALIDATION_FAILED` |

Eksport, a potem import tego pliku, daje tę samą scenę z nowym `id` i datami.

## Scena

Ten sam obiekt trafia do bazy, do odpowiedzi API i do pliku eksportu.

```json
{
  "schemaVersion": 1,
  "id": "21e9794a-540b-4463-a722-12f72587fe6f",
  "type": "map",
  "name": "Wioska",
  "width": 640,
  "height": 480,
  "gridSize": 32,
  "background": { "color": "#7ec850" },
  "layers": [
    {
      "id": "l1",
      "name": "Warstwa 1",
      "visible": true,
      "locked": false,
      "objects": [
        {
          "id": "o1",
          "assetId": "map_building_door_01",
          "x": 320.0,
          "y": 240.0,
          "width": 32,
          "height": 64,
          "rotation": 0.0,
          "scaleX": 1.0,
          "scaleY": 1.0
        }
      ]
    }
  ],
  "createdAt": "2026-11-21T19:32:24.034998Z",
  "updatedAt": "2026-11-21T19:32:24.034998Z"
}
```

| Pole | Typ | Znaczenie |
|---|---|---|
| `schemaVersion` | liczba całkowita | wersja formatu, obecnie 1 |
| `id` | tekst | id projektu; nadaje serwer (UUID) |
| `type` | `"map"` \| `"character"` | mapa albo postać |
| `name` | tekst | nazwa projektu, niepusta |
| `width`, `height` | liczby całkowite | rozmiar płótna w pikselach (mapa: 640×480, 1280×960, 2048×1536; postać: 256×512) |
| `gridSize` | `32` | rozmiar kratki siatki |
| `background.color` | tekst `#rrggbb` | kolor tła |
| `layers` | lista warstw | najwyżej 10; indeks 0 to najniższa warstwa |
| `createdAt`, `updatedAt` | tekst ISO 8601 | data ze strefą czasową, np. `2026-11-21T12:00:00.000Z`; data bez strefy to błąd |

Warstwa: `id` (tekst), `name` (tekst), `visible`, `locked` (true/false), `objects` (lista obiektów, rysowanych od pierwszego do ostatniego).

Obiekt:

| Pole | Typ | Znaczenie |
|---|---|---|
| `id` | tekst | unikalny w całej scenie (wspólna pula z `id` warstw) |
| `assetId` | tekst | `id` assetu z biblioteki, z tego samego modułu co scena |
| `x`, `y` | liczby | środek obiektu w pikselach sceny; (0, 0) to lewy górny róg, Y rośnie w dół; środek musi leżeć w scenie |
| `width`, `height` | liczby całkowite | rozmiar bazowy, równy wymiarom assetu |
| `rotation` | liczba | stopnie zgodnie z ruchem wskazówek zegara, 0–360 |
| `scaleX`, `scaleY` | liczby | skala 0,1–10; rozmiar na scenie to `width × scaleX` na `height × scaleY` |

Typy są ścisłe: liczba podana jako tekst (`"100"`), brakujące pole albo pole spoza tej listy kończą się
problemem `INVALID_FIELD` ze ścieżką, np. `layers[0].objects[1].x`. `id` warstw i obiektów nadaje frontend (dowolny tekst);
backend sprawdza tylko, czy się nie powtarzają. Pełna lista reguł: [ERRORS.md](ERRORS.md#kody-problemów-detailsissuescode).
