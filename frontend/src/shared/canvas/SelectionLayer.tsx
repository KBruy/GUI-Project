// Zaznaczenie nad sceną (F-32): ramka wokół każdego zaznaczonego obiektu,
// kropka w wybranym punkcie i prostokąt, który rysuje się podczas zaznaczania myszą.
import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Layer, Rect } from 'react-konva'
import type { SceneObject } from '@worldsmith/engine'

// Canvas nie czyta zmiennych CSS: czerwień z palety i czarny cień pikseli.
// Ciemny obrys pod czerwoną linią sprawia, że ramkę widać na każdym tle.
const FRAME_COLOR = '#ff1f4b'
const FRAME_SHADOW = '#0a0a0b'
const MARQUEE_FILL = 'rgba(255, 31, 75, 0.15)'
// Kolizja przy przeciąganiu: bursztyn z --color-danger.
const COLLISION_COLOR = '#ffc21f'
// Potrząśnięcie jak klasa .shake z shared/animations: 4 skoki w --duration-normal (160 ms), w px ekranu.
const SHAKE_STEPS = [-4, 4, -2, 0]
const SHAKE_STEP_MS = 40
// Kropka w punkcie center, w px ekranu.
const CENTER_SIZE = 8

// Prostokąt w punktach sceny, od lewego górnego rogu.
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

interface SelectionLayerProps {
  objects: SceneObject[]
  // Obiekty, z którymi koliduje przeciągane zaznaczenie. Gdy są, wszystkie ramki są bursztynowe.
  collisions?: SceneObject[]
  // Prostokąt zaznaczania myszą. Bez niego rysują się tylko ramki.
  marquee?: SelectionRect | null
  // Każda zmiana tej liczby potrząsa ramkami (np. upuszczenie na zajęte miejsce). 0 = bez potrząśnięcia.
  shakeKey?: number
  // Punkt sceny oznaczony kropką, np. środek obiektu, którego współrzędne pokazuje etykieta.
  // Bez niego kropki nie ma.
  center?: { x: number; y: number } | null
  // Zoom widoku, żeby kropka miała ten sam rozmiar na ekranie przy każdym powiększeniu.
  zoom?: number
}

export function SelectionLayer({
  objects,
  collisions = [],
  marquee,
  shakeKey = 0,
  center,
  zoom = 1,
}: SelectionLayerProps) {
  const color = collisions.length > 0 ? COLLISION_COLOR : FRAME_COLOR
  const layerRef = useRef<Konva.Layer>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!shakeKey || !layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Warstwa jest w skali sceny, więc dzielimy przez zoom, żeby drżenie miało stałe px na ekranu.
    const zoom = layer.getStage()?.scaleX() ?? 1
    const timers = SHAKE_STEPS.map((x, i) =>
      setTimeout(() => layer.x(x / zoom), (i + 1) * SHAKE_STEP_MS)
    )
    return () => {
      timers.forEach(clearTimeout)
      layer.x(0)
    }
  }, [shakeKey])

  return (
    // Zaznaczenie nie łapie kliknięć, tak jak siatka.
    <Layer ref={layerRef} listening={false}>
      {[...objects, ...collisions].map((object) => {
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
          <Rect key={object.id} name="selection-frame" {...shape} stroke={color} strokeWidth={2} />,
        ]
      })}
      {center && (
        <Rect
          name="selection-center"
          x={center.x}
          y={center.y}
          width={CENTER_SIZE / zoom}
          height={CENTER_SIZE / zoom}
          offsetX={CENTER_SIZE / zoom / 2}
          offsetY={CENTER_SIZE / zoom / 2}
          fill={color}
          stroke={FRAME_SHADOW}
          strokeWidth={2}
          strokeScaleEnabled={false}
        />
      )}
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
