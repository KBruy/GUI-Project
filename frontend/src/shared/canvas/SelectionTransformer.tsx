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

// Uchwyty w px ekranu: kwadraty w kolorze ramki, jak piksele. Rosną z obiektem na ekranie
// (1/4 krótszego boku), od 5 do 10 px, więc przy małym zoomie (duża mapa) nie zasłaniają obiektu.
const MIN_ANCHOR = 5
const MAX_ANCHOR = 10

function anchorSizeFor(width: number, height: number): number {
  return Math.round(Math.min(Math.max(Math.min(width, height) / 4, MIN_ANCHOR), MAX_ANCHOR))
}

export type ObjectTransform = Pick<SceneObject, 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY'>

interface SelectionTransformerProps {
  // Obiekt z uchwytami, tak jak jest w scenie (bez podglądu zmian).
  object: SceneObject
  // Rozmiar sceny: obrócony i przeskalowany obiekt nie może z niej wyjść.
  bounds: { width: number; height: number }
  // Powiększenie widoku (px ekranu na px sceny): od rozmiaru obiektu na ekranie zależy rozmiar uchwytów.
  zoom: number
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
  zoom,
  scaleLimits,
  onTransform,
  onTransformEnd,
}: SelectionTransformerProps) {
  const anchorSize = anchorSizeFor(
    object.width * object.scaleX * zoom,
    object.height * object.scaleY * zoom
  )
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Transformer trzeba podpiąć do węzła ręcznie, po jego narysowaniu.
  useEffect(() => {
    if (shapeRef.current) transformerRef.current?.nodes([shapeRef.current])
  }, [object])

  // Pudełko z Konvy (w px canvasu, obrót w radianach) jest dobre, gdy skala mieści się
  // w scaleLimits, a wszystkie obrócone narożniki leżą na mapie.
  function fits(box: Box): boolean {
    const layer = transformerRef.current?.getLayer()
    if (!layer) return true
    const zoom = layer.getAbsoluteScale().x
    const scales = [box.width / (object.width * zoom), box.height / (object.height * zoom)]
    // Zapas na zaokrąglenia, tak jak przy krawędzi mapy.
    const tolerance = 0.01
    if (scales.some((s) => s < scaleLimits.min - tolerance || s > scaleLimits.max + tolerance)) {
      return false
    }
    const toScreen = layer.getAbsoluteTransform()
    const min = toScreen.point({ x: 0, y: 0 })
    const max = toScreen.point({ x: bounds.width, y: bounds.height })
    const cos = Math.cos(box.rotation)
    const sin = Math.sin(box.rotation)
    const corners = [
      { x: 0, y: 0 },
      { x: box.width, y: 0 },
      { x: box.width, y: box.height },
      { x: 0, y: box.height },
    ].map(({ x, y }) => ({ x: box.x + x * cos - y * sin, y: box.y + x * sin + y * cos }))
    // Pół piksela zapasu na zaokrąglenia, żeby obiekt dało się obrócić także przy samej krawędzi.
    return corners.every(
      (p) => p.x >= min.x - 0.5 && p.x <= max.x + 0.5 && p.y >= min.y - 0.5 && p.y <= max.y + 0.5
    )
  }

  // Największe t z przedziału 0–1, dla którego box(t) pasuje (szukanie połówkowe, 12 kroków
  // to dokładność lepsza niż promil drogi). Zakłada, że box(0) pasuje.
  function furthest(box: (t: number) => Box): number {
    let good = 0
    let bad = 1
    for (let i = 0; i < 12; i++) {
      const t = (good + bad) / 2
      if (fits(box(t))) good = t
      else bad = t
    }
    return good
  }

  // Gdy nowe pudełko nie pasuje, nie odrzucamy go, tylko dociągamy do granicy, osobno dla
  // szerokości i wysokości: obiekt na limicie wysokości dalej rośnie w poziomie. Przy szybkim
  // ruchu myszy jedno zdarzenie przeskakuje daleko za granicę, a samo odrzucenie zostawiłoby
  // obiekt daleko przed nią, z uchwytem daleko od kursora.
  function allowedBox(oldBox: Box, newBox: Box): Box {
    if (fits(newBox)) return newBox
    if (!fits(oldBox)) return oldBox
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Uchwyt obrotu: krok w stronę nowego pudełka, aż do granicy.
    if (Math.abs(newBox.rotation - oldBox.rotation) > 1e-9) {
      const turned = (t: number): Box => ({
        x: lerp(oldBox.x, newBox.x, t),
        y: lerp(oldBox.y, newBox.y, t),
        width: lerp(oldBox.width, newBox.width, t),
        height: lerp(oldBox.height, newBox.height, t),
        rotation: lerp(oldBox.rotation, newBox.rotation, t),
      })
      const t = furthest(turned)
      return t === 0 ? oldBox : turned(t)
    }

    // Skalowanie: liczymy w osiach obiektu (u wzdłuż szerokości, v wzdłuż wysokości).
    // Na każdej osi jeden bok stoi w miejscu, a drugi jedzie za uchwytem.
    const cos = Math.cos(newBox.rotation)
    const sin = Math.sin(newBox.rotation)
    const along = (box: Box) => ({
      left: box.x * cos + box.y * sin,
      top: -box.x * sin + box.y * cos,
    })
    const before = along(oldBox)
    const after = along(newBox)
    const leftFixed = Math.abs(after.left - before.left) <= 1e-6
    const topFixed = Math.abs(after.top - before.top) <= 1e-6
    // Bok naprzeciw uchwytu: lewy (górny) albo prawy (dolny) z nowego pudełka.
    const right = after.left + newBox.width
    const bottom = after.top + newBox.height
    const sized = (width: number, height: number): Box => {
      const left = leftFixed ? after.left : right - width
      const top = topFixed ? after.top : bottom - height
      return {
        x: left * cos - top * sin,
        y: left * sin + top * cos,
        width,
        height,
        rotation: newBox.rotation,
      }
    }

    // Najpierw limity skali, każda oś osobno.
    const zoom = transformerRef.current?.getLayer()?.getAbsoluteScale().x ?? 1
    const clampSize = (size: number, base: number) =>
      Math.min(Math.max(size, scaleLimits.min * base * zoom), scaleLimits.max * base * zoom)
    const width = clampSize(newBox.width, object.width)
    const height = clampSize(newBox.height, object.height)
    if (fits(sized(width, height))) return sized(width, height)

    // Potem krawędź mapy: dociągamy tę oś, która za nią wychodzi, a drugą zostawiamy.
    if (fits(sized(oldBox.width, height))) {
      const t = furthest((t) => sized(lerp(oldBox.width, width, t), height))
      return sized(lerp(oldBox.width, width, t), height)
    }
    if (fits(sized(width, oldBox.height))) {
      const t = furthest((t) => sized(width, lerp(oldBox.height, height, t)))
      return sized(width, lerp(oldBox.height, height, t))
    }
    const both = (t: number) => sized(lerp(oldBox.width, width, t), lerp(oldBox.height, height, t))
    const t = furthest(both)
    return t === 0 ? oldBox : both(t)
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
        anchorSize={anchorSize}
        anchorCornerRadius={0}
        anchorFill={FRAME_COLOR}
        anchorStroke={FRAME_SHADOW}
        anchorStrokeWidth={anchorSize < MAX_ANCHOR ? 1 : 2}
        rotateAnchorOffset={anchorSize * 2.4}
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
