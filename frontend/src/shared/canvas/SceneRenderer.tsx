// Rysuje scenę z danych (F-26): Stage → Layer na każdą warstwę → obraz na każdy obiekt.
// Wspólny dla edytora map i kreatora postaci. Niczego nie zmienia w scenie, tylko ją pokazuje.
// Dodatkowe warstwy (siatka, zaznaczenie) podaje się jako children, rysują się nad sceną.
import type { ReactNode } from 'react'
import { Image, Layer, Rect, Stage } from 'react-konva'
import type { Scene, SceneObject } from '@worldsmith/engine'
import { useAssetImage } from './useAssetImage'

// Prostokąt zastępczy, dopóki PNG się nie załaduje albo asset nie ma pliku.
// Canvas nie czyta zmiennych CSS, więc kolory są wpisane na stałe (czerwień z palety).
const PLACEHOLDER_FILL = 'rgba(255, 31, 75, 0.25)'
const PLACEHOLDER_STROKE = '#ff1f4b'

interface SceneRendererProps {
  scene: Scene
  // Rozmiar obszaru rysowania w pikselach ekranu.
  width: number
  height: number
  // Adres PNG dla assetu. Bez niego obiekty rysują się jako prostokąty zastępcze.
  getAssetUrl?: (assetId: string) => string | undefined
  children?: ReactNode
}

export function SceneRenderer({ scene, width, height, getAssetUrl, children }: SceneRendererProps) {
  return (
    <Stage width={width} height={height}>
      <Layer listening={false}>
        <Rect width={scene.width} height={scene.height} fill={scene.background.color} />
      </Layer>

      {/* Indeks 0 to najniższa warstwa, więc kolejność z tablicy daje właściwe zasłanianie. */}
      {scene.layers
        .filter((layer) => layer.visible)
        .map((layer) => (
          // Bez wygładzania: pixel art po powiększeniu zostaje ostry.
          <Layer key={layer.id} id={layer.id} imageSmoothingEnabled={false}>
            {layer.objects.map((object) => (
              <SceneObjectNode
                key={object.id}
                object={object}
                url={getAssetUrl?.(object.assetId)}
              />
            ))}
          </Layer>
        ))}

      {children}
    </Stage>
  )
}

function SceneObjectNode({ object, url }: { object: SceneObject; url: string | undefined }) {
  const image = useAssetImage(url)

  // x, y obiektu to jego środek, a Konva liczy od lewego górnego rogu.
  // Przesunięcie (offset) o połowę rozmiaru sprawia, że obrót i skala działają wokół środka.
  const shape = {
    id: object.id,
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    offsetX: object.width / 2,
    offsetY: object.height / 2,
    rotation: object.rotation,
    scaleX: object.scaleX,
    scaleY: object.scaleY,
  }

  if (image) return <Image image={image} {...shape} />
  return <Rect {...shape} fill={PLACEHOLDER_FILL} stroke={PLACEHOLDER_STROKE} strokeWidth={1} />
}
