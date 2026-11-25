# Błędy API

Każdy błąd API ma ten sam kształt. Backend nie wysyła tekstów komunikatów, tylko klucze tłumaczeń (`messageKey`),
a tekst w wybranym języku bierze frontend ze słownika `frontend/src/i18n/dictionary.ts`.

Źródło prawdy w kodzie: `backend/src/errors.py` (słownik `MESSAGE_KEYS`: kod → klucz).

## Format odpowiedzi

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "messageKey": "errors.validationFailed",
    "details": {
      "issues": [
        { "code": "SCALE_OUT_OF_RANGE", "messageKey": "errors.scaleOutOfRange", "layerId": "l1", "objectId": "o7" },
        { "code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": "layers[0].objects[1].x" }
      ]
    }
  }
}
```

- `code`: kod błędu w stylu `UPPER_SNAKE`; po nim frontend może rozpoznać rodzaj błędu.
- `messageKey`: klucz tłumaczenia w stylu `errors.camelCase`; zawsze jest w słowniku frontendu.
- `details`: przy `VALIDATION_FAILED` zawsze `{"issues": [...]}`, przy imporcie pliku o złym kształcie też `issues`;
  w pozostałych błędach pusty obiekt `{}`.
- Domyślna odpowiedź FastAPI `{"detail": ...}` nigdy nie trafia do klienta.
- Odpowiedzi błędów mają nagłówki CORS, więc przeglądarka pozwala frontendowi odczytać ich treść.

Pola jednego problemu (`issues[]`):

| Pole | Kiedy jest | Znaczenie |
|---|---|---|
| `code`, `messageKey` | zawsze | kod i klucz problemu (tabela „Kody problemów”) |
| `layerId` | problem dotyczy warstwy lub obiektu | `id` warstwy |
| `objectId` | problem dotyczy obiektu | `id` obiektu |
| `field` | tylko przy `INVALID_FIELD` | ścieżka do pola, np. `layers[0].objects[1].x`; brak, gdy błąd dotyczy całych danych (np. zły JSON) |

## Kody błędów (`error.code`)

| Kod | Klucz | HTTP | Kiedy |
|---|---|---|---|
| `VALIDATION_FAILED` | `errors.validationFailed` | 422 | scena łamie reguły (w `issues` kody reguł); dane o złym kształcie, np. brak pola, zły typ, nieznane pole, zły JSON, `NaN` (w `issues` problemy `INVALID_FIELD`); zmiana `type` w `PUT` (`INVALID_FIELD` z `field: "type"`); import bez pola `file` |
| `PROJECT_NOT_FOUND` | `errors.projectNotFound` | 404 | brak projektu o podanym `id` (`GET`, `PUT`, `DELETE`, eksport); także `id`, które nie jest UUID |
| `INVALID_FILE` | `errors.invalidFile` | 400 | plik importu nie jest JSON-em (`details: {}`) albo nie ma kształtu sceny (`issues` z `INVALID_FIELD`) |
| `INVALID_FILE` | `errors.invalidFile` | 413 | ciało zapytania albo plik importu większe niż 3 MB |
| `NOT_FOUND` | `errors.notFound` | 404, 405 | nieistniejący adres albo metoda, której adres nie obsługuje |
| `SERVER_ERROR` | `errors.serverError` | 500 | nieobsłużony wyjątek, np. baza danych nie działa; szczegóły trafiają tylko do logów serwera |

Inne błędy 4xx zgłaszane przez FastAPI (ciało, którego nie da się odczytać) też dostają kod `INVALID_FILE`.

## Kody problemów (`details.issues[].code`)

Reguły sceny sprawdza `check_scene` w `backend/src/services/validation.py`, a ich limity są stałymi w `backend/src/config.py`.
Backend zwraca wszystkie problemy naraz w kolejności: pola całej sceny → powtórzone `id` → obiekty po kolei → kolizje.

| Kod | Klucz | `layerId` / `objectId` | Reguła |
|---|---|---|---|
| `INVALID_FIELD` | `errors.invalidField` | brak (jest `field`) | pole ma zły typ, brakuje go albo nie istnieje w kontrakcie (sprawdzają to modele Pydantic jeszcze przed regułami) |
| `UNSUPPORTED_SCHEMA_VERSION` | `errors.unsupportedSchemaVersion` | brak | `schemaVersion` jest różne od 1 |
| `NAME_REQUIRED` | `errors.nameRequired` | brak | nazwa jest pusta albo ma same spacje |
| `INVALID_SCENE_SIZE` | `errors.invalidSceneSize` | brak | mapa ma inny rozmiar niż 640×480, 1280×960, 2048×1536; postać inny niż 256×512 |
| `LAYER_LIMIT` | `errors.layerLimit` | brak | więcej niż 10 warstw |
| `DUPLICATE_ID` | `errors.duplicateId` | warstwa, przy obiekcie też obiekt | `id` się powtarza; warstwy i obiekty mają jedną wspólną pulę `id`, zgłaszane jest każde wystąpienie poza pierwszym |
| `ASSET_NOT_FOUND` | `errors.assetNotFound` | oba | `assetId` obiektu nie istnieje w bibliotece (wtedy pozostałe reguły assetu nie są sprawdzane) |
| `ASSET_WRONG_MODULE` | `errors.assetWrongModule` | oba | asset postaci na mapie albo asset mapy w postaci |
| `ASSET_SIZE_MISMATCH` | `errors.assetSizeMismatch` | oba | `width`/`height` obiektu różnią się od wymiarów assetu; rozmiar zmienia się tylko przez `scaleX`/`scaleY` |
| `SCALE_OUT_OF_RANGE` | `errors.scaleOutOfRange` | oba | `scaleX` lub `scaleY` poza zakresem 0,1–10 (granice dozwolone); jeden problem, nawet gdy obie skale są złe |
| `ROTATION_OUT_OF_RANGE` | `errors.rotationOutOfRange` | oba | `rotation` poza zakresem 0–360 (granice dozwolone) |
| `OBJECT_OUT_OF_BOUNDS` | `errors.objectOutOfBounds` | oba | środek obiektu (`x`, `y`) leży poza sceną; krawędź jest dozwolona, a obiekt może częściowo wystawać |
| `COLLISION` | `errors.collision` | oba | obiekt nachodzi na wcześniejszy obiekt tej samej warstwy (po obrocie i skalowaniu, test SAT w `services/geometry.py`); zgłaszany jest obiekt dalszy na liście, jeden problem na obiekt; stykanie się krawędziami jest dozwolone, a obiekty na różnych warstwach mogą się nakładać |

## Klucz tylko we frontendzie

`errors.network` (brak odpowiedzi serwera) nie pochodzi z backendu: nadaje go `frontend/src/shared/lib/apiClient.ts`,
gdy `fetch` nie dostanie żadnej odpowiedzi. Klucz z backendu, którego nie ma w słowniku, `apiClient` zamienia na `errors.serverError`.

## Nowy kod błędu

1. Wpis kod → klucz w `MESSAGE_KEYS` (`backend/src/errors.py`).
2. Tłumaczenia `pl` i `en` dla nowego klucza w `frontend/src/i18n/dictionary.ts` (bez tego frontend pokaże ogólny `errors.serverError`).
3. Wiersz w jednej z tabel powyżej.

Nowa reguła sceny krok po kroku (sprawdzenie, test, przykład): [ARCHITECTURE.md](ARCHITECTURE.md#nowa-reguła-walidacji).
