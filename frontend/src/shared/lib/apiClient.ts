import { API_URL } from '@/config/env'
import { dictionary, type TranslationKey } from '@/i18n/dictionary'

// Błąd z API. messageKey zawsze jest kluczem ze słownika, więc można go od razu
// pokazać: toast.error(err.messageKey).
export class ApiError extends Error {
  status: number
  code: string
  messageKey: TranslationKey
  details?: unknown

  constructor(status: number, code: string, messageKey: TranslationKey, details?: unknown) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.messageKey = messageKey
    this.details = details
  }
}

// Klucz spoza słownika (np. nowy kod u Franka) nie może trafić do t(), więc podmieniamy go na ogólny.
function toMessageKey(key: unknown): TranslationKey {
  return typeof key === 'string' && Object.hasOwn(dictionary, key)
    ? (key as TranslationKey)
    : 'errors.serverError'
}

// Backend zwraca błędy jako {"error": {code, messageKey, details}} (backend/src/errors.py).
async function toApiError(res: Response): Promise<ApiError> {
  try {
    const { error } = await res.json()
    return new ApiError(res.status, error.code, toMessageKey(error.messageKey), error.details)
  } catch {
    // Odpowiedź bez JSON-a, np. 502 z serwera pośredniczącego.
    return new ApiError(res.status, 'SERVER_ERROR', 'errors.serverError')
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method }
  // FormData (import pliku) wysyłamy bez Content-Type: przeglądarka sama dopisze boundary.
  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  let res: Response
  try {
    res = await fetch(API_URL + path, init)
  } catch {
    // fetch rzuca tylko wtedy, gdy serwer w ogóle nie odpowiedział.
    throw new ApiError(0, 'NETWORK', 'errors.network')
  }

  if (!res.ok) throw await toApiError(res)
  // 204 (np. DELETE) nie ma treści.
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Przykład: const assets = await api.get<Asset[]>('/api/assets?module=map')
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: (path: string) => request<void>('DELETE', path),
}
