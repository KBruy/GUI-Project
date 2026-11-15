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
