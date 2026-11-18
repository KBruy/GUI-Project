# Komunikacja z backendem

Wszystkie zapytania do backendu idą przez `src/shared/lib/apiClient.ts`. Adres serwera bierze z `src/config/env.ts` (`VITE_API_URL`), więc nigdzie nie wpisujemy go ręcznie.

## Użycie

```ts
import { api, ApiError } from '@/shared/lib/apiClient'
import { toast } from '@/shared/components/ui/Toast/toast'

try {
  const assets = await api.get<Asset[]>('/api/assets?module=map')
  const created = await api.post<Project>('/api/projects', scene)
  await api.put<Project>(`/api/projects/${id}`, scene)
  await api.del(`/api/projects/${id}`)
} catch (err) {
  if (err instanceof ApiError) toast.error(err.messageKey)
}
```

- Ciało `post`/`put` jest wysyłane jako JSON. `FormData` (import pliku) idzie bez ręcznego `Content-Type`.
- Odpowiedź 204 (np. `DELETE`) zwraca `undefined`.

## Błędy

Backend zwraca błąd w formacie `{"error": {"code", "messageKey", "details"}}` (`backend/src/errors.py`). Każdy nieudany request rzuca `ApiError` z polami:

| Pole | Co zawiera |
|---|---|
| `status` | kod HTTP, `0` gdy serwer nie odpowiedział |
| `code` | kod z backendu, np. `INVALID_FILE`, albo `NETWORK` |
| `messageKey` | klucz ze słownika, gotowy do `t()` albo `toast.error()` |
| `details` | szczegóły z backendu, np. lista `issues` przy 422 |

`messageKey` zawsze istnieje w `dictionary.ts`:

- brak połączenia → `errors.network`,
- klucz, którego nie ma w słowniku, albo odpowiedź bez JSON-a → `errors.serverError`.

Gdy Franek doda nowy kod błędu w `MESSAGE_KEYS`, dopisujemy jego klucz `errors.*` do `dictionary.ts`. Do tego czasu użytkownik zobaczy ogólny komunikat.

## Zapis i wczytywanie mapy

Mapa w edytorze to projekt z `/api/projects` (F-38). Wszystko siedzi w `features/map-editor/store/editorStore.ts`:

| Pole / akcja | Co robi |
|---|---|
| `projectId` | id projektu w backendzie, `null` dla mapy jeszcze niezapisanej |
| `save()` | pierwszy zapis `POST /api/projects`, kolejne `PUT /api/projects/<id>`, zawsze cała scena |
| `openProject(id)` | `GET /api/projects/<id>`, dosuwa wystające obiekty do mapy i wczytuje scenę |
| `hasUnsavedChanges(state)` | czy scena zmieniła się od zapisu albo wczytania (porównanie referencji) |

- Oba wywołania przy błędzie rzucają `ApiError`. Toast pokazuje `saveProject()` (przycisk „Zapisz” i Ctrl+S / Cmd+S) albo `useProjectUrl` (wczytywanie).
- Sceny w edytorze nie podmieniamy odpowiedzią z zapisu: bierzemy z niej tylko `id`. Zmiana zrobiona w trakcie zapisu zostaje niezapisana.
- Backend sprawdza tylko środek obiektu, a edytor zakłada, że każdy obiekt jest w całości na mapie. Dlatego `openProject` dosuwa wystające obiekty do krawędzi, a większe od mapy stawia na środku. Kolizji po dosunięciu nie sprawdzamy.

Adres idzie za projektem (`features/map-editor/useProjectUrl.ts`): po pierwszym zapisie `/map` → `/map/<id>`, po „Nowa mapa” z powrotem `/map`. Wejście na `/map/<id>` (link, odświeżenie) wczytuje projekt, a nieistniejące id pokazuje toast i wraca na `/map`.

Przy niezapisanych zmianach przeglądarka pyta przed zamknięciem albo odświeżeniem karty (`useUnsavedWarning` w `AppLayout`). Przejście na inną podstronę aplikacji nie pyta, bo scena zostaje w store.

## Status serwera w stopce

`AppFooter` odpytuje `GET /api/health` zaraz po starcie i potem co 30 s. Po prawej stronie stopki widać „Serwer: połączono” albo „Serwer: brak połączenia” (kolor `--color-danger`). Gdy backend nie działa, od razu widać to w aplikacji, a nie dopiero po pierwszym zapisie.

W testach, które renderują cały layout, `fetch` jest podmieniony (`vi.stubGlobal`), żeby nie łączyć się z prawdziwym backendem. Przykład w `src/app/App.test.tsx`.
