// Siatka nad sceną (F-27): linie co `size` pikseli na całej powierzchni sceny.
// Rysowana jako jeden kształt (jedno pociągnięcie), a nie setki osobnych linii,
// więc nawet duża mapa (64×48 pól) nie spowalnia przeciągania.
import { Layer, Shape } from 'react-konva'

// Canvas nie czyta zmiennych CSS. Półprzezroczysta czerń widać i na trawie, i na jasnym tle.
const GRID_COLOR = 'rgba(0, 0, 0, 0.2)'

interface GridLayerProps {
  // Rozmiar sceny w pikselach.
  width: number
  height: number
  // Odstęp między liniami, zwykle scene.gridSize (32).
  size: number
}

export function GridLayer({ width, height, size }: GridLayerProps) {
  return (
    // Siatka nie łapie kliknięć, więc nie przeszkadza w zaznaczaniu obiektów pod nią.
    <Layer listening={false}>
      <Shape
        stroke={GRID_COLOR}
        strokeWidth={1}
        // Linia ma zawsze 1 px na ekranie, niezależnie od zoomu (F-28).
        strokeScaleEnabled={false}
        sceneFunc={(context, shape) => {
          context.beginPath()
          for (let x = 0; x <= width; x += size) {
            context.moveTo(x, 0)
            context.lineTo(x, height)
          }
          for (let y = 0; y <= height; y += size) {
            context.moveTo(0, y)
            context.lineTo(width, y)
          }
          context.strokeShape(shape)
        }}
      />
    </Layer>
  )
}
