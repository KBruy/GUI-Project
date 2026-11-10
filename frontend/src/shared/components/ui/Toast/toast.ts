import type { TranslationKey } from '@/i18n/dictionary'

// Magazyn toastów poza Reactem: toast.error(...) można zawołać z dowolnego miejsca,
// także z apiClient (F-23), który nie jest komponentem. ToastViewport tylko je wyświetla.

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  // Klucz, nie gotowy tekst: kod spoza Reacta nie ma dostępu do t().
  messageKey: TranslationKey
}

const DURATION_MS = 4000

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

// Każda zmiana tworzy nową tablicę, więc React wie, że ma przerysować listę.
function setToasts(next: ToastItem[]) {
  toasts = next
  listeners.forEach((listener) => listener())
}

function show(type: ToastType, messageKey: TranslationKey) {
  const id = nextId++
  setToasts([...toasts, { id, type, messageKey }])
  setTimeout(() => dismissToast(id), DURATION_MS)
  return id
}

export const toast = {
  success: (messageKey: TranslationKey) => show('success', messageKey),
  error: (messageKey: TranslationKey) => show('error', messageKey),
  info: (messageKey: TranslationKey) => show('info', messageKey),
}

export function dismissToast(id: number) {
  setToasts(toasts.filter((item) => item.id !== id))
}

// Dla useSyncExternalStore w ToastViewport.
export function subscribeToasts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts() {
  return toasts
}
