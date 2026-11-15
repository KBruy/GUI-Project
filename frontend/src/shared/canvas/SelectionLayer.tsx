// Zaznaczenie nad sceną (F-32): ramka wokół każdego zaznaczonego obiektu
// i prostokąt, który rysuje się podczas zaznaczania myszą.
import { Layer, Rect } from 'react-konva'
import type { SceneObject } from '@worldsmith/engine'

// Canvas nie czyta zmiennych CSS: czerwień z palety i czarny cień pikseli.
// Ciemny obrys pod czerwoną linią sprawia, że ramkę widać na każdym tle.
const FRAME_COLOR = '#ff1f4b'
const FRAME_SHADOW = '#0a0a0b'
const MARQUEE_FILL = 'rgba(255, 31, 75, 0.15)'

// Prostokąt w punktach sceny, od lewego górnego rogu.
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

interface SelectionLayerProps {
  objects: SceneObject[]
  // Prostokąt zaznaczania myszą. Bez niego rysują się tylko ramki.
  marquee?: SelectionRect | null
}

export function SelectionLayer({ objects, marquee }: SelectionLayerProps) {
  return (
    // Zaznaczenie nie łapie kliknięć, tak jak siatka.
    <Layer listening={false}>
      {objects.map((object) => {
        // To samo położenie, obrót i skala co obiekt w SceneRenderer, więc ramka obraca się razem z nim.
        const shape = {
          x: object.x,
          y: object.y,
          width: object.width,
          height: object.height,
          offsetX: object.width / 2,
          offsetY: object.height / 2,
          rotation: object.rotation,
          scaleX: object.scaleX,
          scaleY: object.scaleY,
          // Grubość linii na ekranie nie zależy od zoomu ani skali obiektu.
          strokeScaleEnabled: false,
        }
        return [
          <Rect key={`${object.id}-shadow`} {...shape} stroke={FRAME_SHADOW} strokeWidth={4} />,
          <Rect
            key={object.id}
            name="selection-frame"
            {...shape}
            stroke={FRAME_COLOR}
            strokeWidth={2}
          />,
        ]
      })}
      {marquee && (
        <Rect
          name="selection-marquee"
          {...marquee}
          fill={MARQUEE_FILL}
          stroke={FRAME_COLOR}
          strokeWidth={1}
          dash={[4, 4]}
          strokeScaleEnabled={false}
        />
      )}
    </Layer>
  )
}
