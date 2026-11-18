// Tymczasowa zaślepka silnika Kuby (F-24). API jak w rozdziale 6.3 dokumentu technicznego,
// ale w środku uproszczona:
// - kolizja to prostokąty otaczające obiekty, przy obrocie trochę za duże (prawdziwy silnik
//   liczy SAT, PR #122),
// - cofnij/ponów pamięta kopie całej sceny zamiast poleceń z metodą undo.
import type { Scene, SceneObject, Layer } from '@worldsmith/engine'

export interface Point {
  x: number
  y: number
}

// Prostokąt od lewego górnego rogu (np. zaznaczanie myszą).
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

// Tyle z assetu potrzebuje silnik, żeby postawić obiekt.
export interface AssetSize {
  id: string
  width: number
  height: number
}

export type PlaceResult = { ok: true } | { ok: false; collidesWith: string[] }

// Polecenie dostaje scenę i zwraca nową (starej nie zmienia) albo listę kolizji.
// Dla reszty aplikacji to „czarna skrzynka”: tworzy się je funkcjami poniżej i podaje do execute.
export type Command = (scene: Scene) => { scene: Scene } | { collidesWith: string[] }

export interface Editor {
  getScene(): Scene
  // Zwraca funkcję, która wypisuje słuchacza.
  subscribe(listener: (scene: Scene) => void): () => void
  execute(command: Command): PlaceResult
  canPlace(objectId: string, transform: Partial<Transform>): PlaceResult
  // Wynik polecenia bez zmiany sceny (podgląd przeciągania kilku obiektów). Do uzgodnienia z Kubą.
  canExecute(command: Command): PlaceResult
  undo(): void
  redo(): void
  snapToGrid(point: Point): Point
  objectsInRect(rect: Rect): string[]
}

// Prostokąt zajmowany przez obiekt. x, y obiektu to jego środek.
// Obrócony obiekt zajmuje prostokąt otaczający jego obrócone narożniki.
function bounds(object: SceneObject): Rect {
  const angle = (object.rotation * Math.PI) / 180
  const w = object.width * object.scaleX
  const h = object.height * object.scaleY
  // Zaokrąglenie usuwa resztki z cos(90°) ≈ 6e-17, żeby stykanie się krawędziami nie było kolizją.
  const round = (value: number) => Math.round(value * 1e6) / 1e6
  const width = round(Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle)))
  const height = round(Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle)))
  return { x: object.x - width / 2, y: object.y - height / 2, width, height }
}

// Ostre nierówności: stykanie się krawędziami nie jest kolizją (rozdz. 6.4).
function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

// Id obiektów z listy, na które nachodzi candidate. Obiekty z ignore są pomijane.
function collisionsWith(
  objects: SceneObject[],
  candidate: SceneObject,
  ignore: string[]
): string[] {
  const box = bounds(candidate)
  return objects
    .filter((other) => !ignore.includes(other.id) && overlaps(box, bounds(other)))
    .map((other) => other.id)
}

function mapLayers(scene: Scene, update: (layer: Layer) => Layer): Scene {
  return { ...scene, layers: scene.layers.map(update) }
}

export function addObject(layerId: string, asset: AssetSize, at: Point): Command {
  // Id powstaje raz, przy tworzeniu polecenia.
  const object: SceneObject = {
    id: crypto.randomUUID(),
    assetId: asset.id,
    x: at.x,
    y: at.y,
    width: asset.width,
    height: asset.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  }

  return (scene) => {
    const layer = scene.layers.find((l) => l.id === layerId)
    const collidesWith = layer ? collisionsWith(layer.objects, object, []) : []
    if (collidesWith.length > 0) return { collidesWith }
    return {
      scene: mapLayers(scene, (l) =>
        l.id === layerId ? { ...l, objects: [...l.objects, object] } : l
      ),
    }
  }
}

// Zmienia podane obiekty funkcją update i sprawdza kolizje każdego z nich na jego warstwie.
// Obiekty z ids nie kolidują ze sobą nawzajem, bo przesuwają się razem.
function updateObjects(ids: string[], update: (object: SceneObject) => SceneObject): Command {
  return (scene) => {
    const collidesWith = new Set<string>()
    const next = mapLayers(scene, (layer) => {
      const objects = layer.objects.map((o) => (ids.includes(o.id) ? update(o) : o))
      for (const moved of objects.filter((o) => ids.includes(o.id))) {
        collisionsWith(objects, moved, ids).forEach((id) => collidesWith.add(id))
      }
      return { ...layer, objects }
    })
    if (collidesWith.size > 0) return { collidesWith: [...collidesWith] }
    return { scene: next }
  }
}

// Ustawia te same wartości wszystkim podanym obiektom, np. { x: 320, y: 128 } albo { rotation: 90 }.
export function transformObjects(ids: string[], transform: Partial<Transform>): Command {
  return updateObjects(ids, (o) => ({ ...o, ...transform }))
}

// Przesuwa podane obiekty o ten sam wektor (przeciąganie kilku zaznaczonych, strzałki).
// Jedno polecenie, więc Ctrl+Z cofa przesunięcie całej grupy naraz.
// Nie ma go w rozdz. 6.3, do uzgodnienia z Kubą.
export function moveObjects(ids: string[], delta: Point): Command {
  return updateObjects(ids, (o) => ({ ...o, x: o.x + delta.x, y: o.y + delta.y }))
}

export function removeObjects(ids: string[]): Command {
  return (scene) => ({
    scene: mapLayers(scene, (layer) => ({
      ...layer,
      objects: layer.objects.filter((o) => !ids.includes(o.id)),
    })),
  })
}

export function createEditor(initialScene: Scene): Editor {
  let scene = initialScene
  const past: Scene[] = []
  let future: Scene[] = []
  const listeners = new Set<(scene: Scene) => void>()

  function setScene(next: Scene) {
    scene = next
    listeners.forEach((listener) => listener(scene))
  }

  return {
    getScene: () => scene,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    execute(command) {
      const result = command(scene)
      if ('collidesWith' in result) return { ok: false, collidesWith: result.collidesWith }
      past.push(scene)
      future = []
      setScene(result.scene)
      return { ok: true }
    },

    canExecute(command) {
      const result = command(scene)
      return 'collidesWith' in result
        ? { ok: false, collidesWith: result.collidesWith }
        : { ok: true }
    },

    canPlace(objectId, transform) {
      const layer = scene.layers.find((l) => l.objects.some((o) => o.id === objectId))
      const object = layer?.objects.find((o) => o.id === objectId)
      if (!layer || !object) throw new Error(`Unknown object: ${objectId}`)
      const collidesWith = collisionsWith(layer.objects, { ...object, ...transform }, [objectId])
      return collidesWith.length > 0 ? { ok: false, collidesWith } : { ok: true }
    },

    undo() {
      const previous = past.pop()
      if (!previous) return
      future.push(scene)
      setScene(previous)
    },

    redo() {
      const next = future.pop()
      if (!next) return
      past.push(scene)
      setScene(next)
    },

    snapToGrid: ({ x, y }) => ({
      x: Math.round(x / scene.gridSize) * scene.gridSize,
      y: Math.round(y / scene.gridSize) * scene.gridSize,
    }),

    // Tylko widoczne warstwy: ukrytych obiektów nie da się zaznaczyć.
    objectsInRect: (rect) =>
      scene.layers
        .filter((layer) => layer.visible)
        .flatMap((layer) => layer.objects)
        .filter((object) => overlaps(rect, bounds(object)))
        .map((object) => object.id),
  }
}
