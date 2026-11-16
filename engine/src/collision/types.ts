/** Położenie, obrót i skala obiektu: to, co użytkownik zmienia przeciąganiem i uchwytami. */
export interface Transform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

/**
 * Wynik sprawdzenia, czy obiekt można postawić.
 * ok: false niesie id obiektów, z którymi koliduje (frontend podświetla je na czerwono).
 */
export type PlaceResult = { ok: true } | { ok: false; collidesWith: string[] }
