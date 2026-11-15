// Ładuje PNG assetu do <img>, którego potrzebuje Konva.
// Cache jest wspólny dla całej aplikacji: ten sam plik ładuje się raz,
// nawet gdy na scenie stoi 200 takich samych drzew.
import { useCallback, useSyncExternalStore } from 'react'

const cache = new Map<string, HTMLImageElement>()

function loadImage(url: string): HTMLImageElement {
  let image = cache.get(url)
  if (!image) {
    image = new window.Image()
    // Obraz z backendu (inny port) nie może „brudzić” canvasu, bo eksportujemy go do PNG.
    image.crossOrigin = 'anonymous'
    image.src = url
    cache.set(url, image)
  }
  return image
}

function isReady(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0
}

// Zwraca obraz, gdy jest gotowy. Do tego czasu, a także przy błędzie ładowania, zwraca null,
// więc komponent może narysować coś zastępczego.
export function useAssetImage(url: string | undefined): HTMLImageElement | null {
  const image = url ? loadImage(url) : null

  const subscribe = useCallback(
    (onChange: () => void) => {
      image?.addEventListener('load', onChange)
      return () => image?.removeEventListener('load', onChange)
    },
    [image]
  )

  return useSyncExternalStore(subscribe, () => (image && isReady(image) ? image : null))
}
