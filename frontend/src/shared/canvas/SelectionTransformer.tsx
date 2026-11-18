// Uchwyty obrotu i skali na jednym zaznaczonym obiekcie (F-34), z Transformera Konvy.
// Transformer zmienia niewidoczny prostokąt o kształcie obiektu, a nie sam obiekt w scenie:
// komponent tylko podaje nowe wartości (onTransform w trakcie, onTransformEnd na końcu),
// a scenę zmienia ten, kto go używa. Shift przy obrocie skacze co 15°, Shift przy skali
// trzyma proporcje (oba zachowania wbudowane w Konvę).
import type Konva from 'konva'
import type { Box } from 'konva/lib/shapes/Transformer'
import { useEffect, useRef } from 'react'
import { Layer, Rect, Transformer } from 'react-konva'
import type { SceneObject } from '@worldsmith/engine'
import { FRAME_COLOR, FRAME_SHADOW } from './SelectionLayer'

// Uchwyty w px ekranu: kwadraty w kolorze ramki, jak piksele.
const ANCHOR_SIZE = 10
const ROTATE_OFFSET = 24

export type ObjectTransform = Pick<SceneObject, 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY'>

interface SelectionTransformerProps {
  // Obiekt z uchwytami, tak jak jest w scenie (bez podglądu zmian).
  object: SceneObject
  // Rozmiar sceny: obrócony i przeskalowany obiekt nie może z niej wyjść.
  bounds: { width: number; height: number }
  // Najmniejsza i największa skala obiektu. Uchwyty zatrzymują się na nich razem z obiektem.
  scaleLimits: { min: number; max: number }
  onTransform: (transform: ObjectTransform) => void
  onTransformEnd: (transform: ObjectTransform) => void
}

// Położenie, obrót i skala prostokąta jak obiektu w SceneRenderer (x, y to środek).
function shapeOf(object: SceneObject) {
  return {
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
}

function transformOf(node: Konva.Node): ObjectTransform {
  return {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
  }
}

export function SelectionTransformer({
  object,
  bounds,
  scaleLimits,
  onTransform,
  onTransformEnd,
}: SelectionTransformerProps) {
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Transformer trzeba podpiąć do węzła ręcznie, po jego narysowaniu.
  useEffect(() => {
    if (shapeRef.current) transformerRef.current?.nodes([shapeRef.current])
  }, [object])

  // Nowe pudełko z Konvy (w px canvasu, obrót w radianach) jest dobre, gdy skala mieści się
  // w scaleLimits, a wszystkie obrócone narożniki leżą na mapie. Inaczej zostaje poprzednie.
  function allowedBox(oldBox: Box, newBox: Box): Box {
    const layer = transformerRef.current?.getLayer()
    if (!layer) return newBox
    // Bez tego Konva rozciąga uchwyty dalej, a obiekt stoi na limicie i ramka się od niego odkleja.
    const zoom = layer.getAbsoluteScale().x
    const scales = [newBox.width / (object.width * zoom), newBox.height / (object.height * zoom)]
    // Zapas na zaokrąglenia, tak jak przy krawędzi mapy.
    const tolerance = 0.01
    if (scales.some((s) => s < scaleLimits.min - tolerance || s > scaleLimits.max + tolerance)) {
      return oldBox
    }
    const toScreen = layer.getAbsoluteTransform()
    const min = toScreen.point({ x: 0, y: 0 })
    const max = toScreen.point({ x: bounds.width, y: bounds.height })
    const cos = Math.cos(newBox.rotation)
    const sin = Math.sin(newBox.rotation)
    const corners = [
      { x: 0, y: 0 },
      { x: newBox.width, y: 0 },
      { x: newBox.width, y: newBox.height },
      { x: 0, y: newBox.height },
    ].map(({ x, y }) => ({ x: newBox.x + x * cos - y * sin, y: newBox.y + x * sin + y * cos }))
    // Pół piksela zapasu na zaokrąglenia, żeby obiekt dało się obrócić także przy samej krawędzi.
    const inside = corners.every(
      (p) => p.x >= min.x - 0.5 && p.x <= max.x + 0.5 && p.y >= min.y - 0.5 && p.y <= max.y + 0.5
    )
    return inside ? newBox : oldBox
  }

  return (
    <Layer>
      <Rect
        ref={shapeRef}
        {...shapeOf(object)}
        // Niewidoczny: obiekt rysuje SceneRenderer, a ramkę SelectionLayer.
        listening={false}
      />
      <Transformer
        ref={transformerRef}
        // Ramkę rysuje SelectionLayer, więc Transformer daje tylko uchwyty.
        borderEnabled={false}
        anchorSize={ANCHOR_SIZE}
        anchorCornerRadius={0}
        anchorFill={FRAME_COLOR}
        anchorStroke={FRAME_SHADOW}
        anchorStrokeWidth={2}
        rotateAnchorOffset={ROTATE_OFFSET}
        // Bez Shifta krawędzie i narożniki skalują osie osobno, z Shiftem proporcjonalnie.
        keepRatio={false}
        // Backend nie przyjmuje ujemnej skali, więc bez odbicia lustrzanego.
        flipEnabled={false}
        boundBoxFunc={allowedBox}
        onTransform={() => shapeRef.current && onTransform(transformOf(shapeRef.current))}
        onTransformEnd={() => {
          const shape = shapeRef.current
          if (!shape) return
          onTransformEnd(transformOf(shape))
          // Wracamy do obiektu ze sceny. Gdy zmiana się zapisała, nowe wartości przyjdą w propsach.
          shape.setAttrs(shapeOf(object))
          transformerRef.current?.forceUpdate()
        }}
        // Uchwyty nie przekazują kliknięcia dalej: inaczej zaznaczanie na canvasie uznałoby je
        // za klik w puste miejsce albo za chwycenie obiektu.
        onPointerDown={(e) => e.evt.stopPropagation()}
      />
    </Layer>
  )
}
