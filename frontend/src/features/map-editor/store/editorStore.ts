// Store edytora map (F-25). Trzyma instancję silnika i stan widoku.
// Komponenty nie wołają silnika bezpośrednio, tylko akcji ze store'u.
// Scena w store jest kopią z silnika: odświeża ją subscribe, więc po każdym execute,
// undo i redo komponenty, które jej używają, renderują się od nowa.
import { create } from 'zustand'
import type { TranslationKey } from '@/i18n/dictionary'
import { ApiError, api } from '@/shared/lib/apiClient'
import type { Asset } from '@/shared/lib/assets'
import {
  addObject,
  createEditor,
  moveObjects,
  type Command,
  type Editor,
  type PlaceResult,
  type Point,
  type Rect,
  type Scene,
} from '../engine/engine'
import { clampOffset, fitView, toScenePoint, zoomAt, type Size } from '../view'

export type Tool = 'select' | 'pan'

interface EditorState {
  editor: Editor | null
  scene: Scene | null
  selectedIds: string[]
  tool: Tool
  activeLayerId: string | null
  zoom: number
  // Przesunięcie widoku w pikselach ekranu.
  offset: Point
  // Rozmiar obszaru canvasu na ekranie (mierzy go MapCanvas).
  viewport: Size
  // Przełączniki z paska narzędzi (F-27). Zostają po wczytaniu innej sceny.
  gridVisible: boolean
  gridSnap: boolean
  // Biblioteka assetów mapy z backendu (F-31) i klucz błędu, gdy nie udało się jej pobrać.
  assets: Asset[]
  assetsError: TranslationKey | null
  // idle: jeszcze nie pobieraliśmy, done: pobrane albo błąd.
  assetsStatus: 'idle' | 'loading' | 'done'

  loadScene: (scene: Scene) => void
  execute: (command: Command) => PlaceResult
  undo: () => void
  redo: () => void
  select: (ids: string[]) => void
  // Kliknięcie w punkt sceny: zaznacza najwyższy obiekt pod nim, a w puste miejsce czyści zaznaczenie.
  // toggle (Shift): dodaje obiekt do zaznaczenia albo go z niego zdejmuje, pustego miejsca nie liczy.
  // Zwraca id trafionego obiektu albo null, gdy kliknięto w puste miejsce.
  selectAt: (point: Point, toggle: boolean) => string | null
  // Id najwyższego obiektu z widocznych warstw pod punktem sceny, bez zmiany zaznaczenia.
  objectAt: (point: Point) => string | null
  // Prostokąt zaznaczenia w punktach sceny. add (Shift): dokłada do obecnego zaznaczenia.
  selectInRect: (rect: Rect, add: boolean) => void
  setTool: (tool: Tool) => void
  setActiveLayer: (layerId: string) => void
  setViewport: (viewport: Size) => void
  // Zoom w punkcie ekranu (np. pod kursorem). Bez punktu: środek canvasu.
  zoomTo: (zoom: number, anchor?: Point) => void
  panBy: (dx: number, dy: number) => void
  fitToScreen: () => void
  setGridVisible: (visible: boolean) => void
  setGridSnap: (snap: boolean) => void
  loadAssets: () => Promise<void>
  // Dodaje asset na aktywną warstwę w punkcie sceny `at`. Bez punktu: w wolnym miejscu
  // najbliżej środka widoku, żeby kolejne kliknięcia w paletę nie trafiały w zajęte pole.
  addAsset: (asset: Asset, at?: Point) => PlaceResult
  // Przesuwa zaznaczone obiekty o wektor w punktach sceny, jednym krokiem cofania.
  // Wektor jest przycinany tak, żeby cała grupa została w granicach mapy.
  moveSelected: (delta: Point) => PlaceResult
  // Podgląd przeciągania zaznaczonych obiektów, bez zmiany sceny. Zwraca wektor po przyciąganiu
  // (lewy górny róg obiektu `anchorId` trafia na siatkę) i przycięciu do mapy oraz wynik kolizji.
  planMove: (delta: Point, anchorId: string) => { delta: Point; result: PlaceResult }
}

// Ile pierścieni pól wokół środka widoku sprawdzamy przy szukaniu wolnego miejsca.
const FREE_SPOT_RINGS = 8

// Środek nowego obiektu: z przyciąganiem lewy górny róg trafia w siatkę,
// a cały obiekt zostaje w granicach mapy. To decyzja frontendu: backend sprawdza tylko
// środek obiektu (rozdz. 5.5), więc przyjąłby też obiekt, który częściowo wystaje.
function placeAsset(target: Point, asset: Asset, scene: Scene, snap: boolean): Point {
  const axis = (value: number, size: number, max: number) => {
    let start = value - size / 2
    if (snap) start = Math.round(start / scene.gridSize) * scene.gridSize
    start = Math.max(0, Math.min(max - size, start))
    return start + size / 2
  }
  return {
    x: axis(target.x, asset.width, scene.width),
    y: axis(target.y, asset.height, scene.height),
  }
}

// Przycina wektor przesunięcia tak, żeby obiekty ids nie wyszły poza mapę. Tak jak w placeAsset
// to decyzja frontendu (backend sprawdza tylko środek). Obrócony obiekt zajmuje prostokąt
// otaczający jego obrócone narożniki.
function clampMove(scene: Scene, ids: string[], delta: Point): Point {
  const boxes = scene.layers
    .flatMap((layer) => layer.objects)
    .filter((object) => ids.includes(object.id))
    .map((object) => {
      const angle = (object.rotation * Math.PI) / 180
      const width = object.width * object.scaleX
      const height = object.height * object.scaleY
      const halfW = (Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle))) / 2
      const halfH = (Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle))) / 2
      return {
        x: object.x - halfW,
        y: object.y - halfH,
        right: object.x + halfW,
        bottom: object.y + halfH,
      }
    })
  if (boxes.length === 0) return { x: 0, y: 0 }
  // Zakłada, że obiekty już są w całości na mapie: edytor nie pozwala postawić ich inaczej.
  // Sceny z backendu (wczytanie, import) mogą mieć obiekty wystające, bo backend sprawdza
  // tylko środek. Dosuwamy je do mapy przy wczytaniu sceny (F-38).
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
  return {
    x: clamp(
      delta.x,
      -Math.min(...boxes.map((b) => b.x)),
      scene.width - Math.max(...boxes.map((b) => b.right))
    ),
    y: clamp(
      delta.y,
      -Math.min(...boxes.map((b) => b.y)),
      scene.height - Math.max(...boxes.map((b) => b.bottom))
    ),
  }
}

// Wypisuje store z poprzedniego silnika przy wczytaniu nowej sceny.
let unsubscribe: (() => void) | null = null

export const useEditorStore = create<EditorState>()((set, get) => ({
  editor: null,
  scene: null,
  selectedIds: [],
  tool: 'select',
  activeLayerId: null,
  zoom: 1,
  offset: { x: 0, y: 0 },
  viewport: { width: 0, height: 0 },
  gridVisible: true,
  gridSnap: true,
  assets: [],
  assetsError: null,
  assetsStatus: 'idle',

  loadScene(scene) {
    unsubscribe?.()
    const editor = createEditor(scene)
    unsubscribe = editor.subscribe((next) => {
      // Po cofnięciu dodania obiekt znika ze sceny, więc nie może zostać zaznaczony.
      const ids = new Set(next.layers.flatMap((layer) => layer.objects.map((o) => o.id)))
      set({ scene: next, selectedIds: get().selectedIds.filter((id) => ids.has(id)) })
    })
    set({
      editor,
      scene: editor.getScene(),
      selectedIds: [],
      // Nowe obiekty trafiają domyślnie na najwyższą warstwę.
      activeLayerId: scene.layers.at(-1)?.id ?? null,
    })
    get().fitToScreen()
  },

  execute(command) {
    const { editor } = get()
    if (!editor) throw new Error('No scene loaded')
    return editor.execute(command)
  },
  undo: () => get().editor?.undo(),
  redo: () => get().editor?.redo(),

  select: (ids) => set({ selectedIds: ids }),
  selectAt(point, toggle) {
    const { selectedIds } = get()
    const hit = get().objectAt(point)
    if (!toggle) {
      set({ selectedIds: hit ? [hit] : [] })
    } else if (hit) {
      const selected = selectedIds.includes(hit)
      set({
        selectedIds: selected ? selectedIds.filter((id) => id !== hit) : [...selectedIds, hit],
      })
    }
    return hit
  },
  objectAt(point) {
    // Silnik zwraca obiekty od najniższego, więc ostatni jest na wierzchu.
    // Ukryte warstwy silnik pomija sam.
    return (
      get()
        .editor?.objectsInRect({ ...point, width: 0, height: 0 })
        .at(-1) ?? null
    )
  },
  selectInRect(rect, add) {
    const { editor, selectedIds } = get()
    if (!editor) return
    const ids = editor.objectsInRect(rect)
    set({ selectedIds: add ? [...new Set([...selectedIds, ...ids])] : ids })
  },
  setTool: (tool) => set({ tool }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  setViewport(viewport) {
    const { viewport: old, scene, zoom, offset } = get()
    set({ viewport })
    // Pierwszy pomiar: dopiero teraz wiadomo, jak dopasować scenę do ekranu.
    if (old.width === 0) {
      get().fitToScreen()
      return
    }
    // Zmiana rozmiaru (okno, pełny ekran): środek widoku zostaje na środku,
    // a mapa nie może uciec poza ekran.
    const centered = {
      x: offset.x + (viewport.width - old.width) / 2,
      y: offset.y + (viewport.height - old.height) / 2,
    }
    set({ offset: scene ? clampOffset(centered, zoom, scene, viewport) : centered })
  },

  zoomTo(zoom, anchor) {
    const { scene, viewport } = get()
    if (!scene) return
    const point = anchor ?? { x: viewport.width / 2, y: viewport.height / 2 }
    const next = zoomAt(get(), point, zoom)
    set({ zoom: next.zoom, offset: clampOffset(next.offset, next.zoom, scene, viewport) })
  },

  panBy(dx, dy) {
    const { scene, viewport, zoom, offset } = get()
    if (!scene) return
    set({ offset: clampOffset({ x: offset.x + dx, y: offset.y + dy }, zoom, scene, viewport) })
  },

  fitToScreen() {
    const { scene, viewport } = get()
    if (!scene || viewport.width === 0) return
    set(fitView(scene, viewport))
  },
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setGridSnap: (gridSnap) => set({ gridSnap }),

  async loadAssets() {
    set({ assetsStatus: 'loading' })
    try {
      const assets = await api.get<Asset[]>('/api/assets?module=map')
      set({ assets, assetsError: null, assetsStatus: 'done' })
    } catch (err) {
      set({
        assetsError: err instanceof ApiError ? err.messageKey : 'errors.serverError',
        assetsStatus: 'done',
      })
    }
  },

  addAsset(asset, at) {
    const { scene, activeLayerId, viewport, gridSnap } = get()
    if (!scene || !activeLayerId) throw new Error('No scene loaded')
    const place = (target: Point) =>
      get().execute(addObject(activeLayerId, asset, placeAsset(target, asset, scene, gridSnap)))
    if (at) return place(at)

    const center = toScenePoint({ x: viewport.width / 2, y: viewport.height / 2 }, get())
    const step = scene.gridSize
    // Sprawdzamy kolejne „pierścienie” pól siatki wokół środka, aż któreś będzie wolne.
    let result = place(center)
    for (let ring = 1; !result.ok && ring <= FREE_SPOT_RINGS; ring++) {
      for (let dx = -ring; dx <= ring && !result.ok; dx++) {
        for (let dy = -ring; dy <= ring && !result.ok; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
          result = place({ x: center.x + dx * step, y: center.y + dy * step })
        }
      }
    }
    return result
  },

  moveSelected(delta) {
    const { scene, selectedIds } = get()
    if (!scene || selectedIds.length === 0) return { ok: true }
    const move = clampMove(scene, selectedIds, delta)
    // Grupa już stoi przy krawędzi: nie zapisujemy pustego kroku w historii cofania.
    if (move.x === 0 && move.y === 0) return { ok: true }
    return get().execute(moveObjects(selectedIds, move))
  },

  planMove(delta, anchorId) {
    const { scene, editor, selectedIds, gridSnap } = get()
    if (!scene || !editor) return { delta: { x: 0, y: 0 }, result: { ok: true } }
    // Pixel art: obiekty stoją na całych pikselach, także przy zoomie i bez przyciągania.
    let move = { x: Math.round(delta.x), y: Math.round(delta.y) }
    const anchor = scene.layers.flatMap((layer) => layer.objects).find((o) => o.id === anchorId)
    if (gridSnap && anchor) {
      const snap = (start: number, value: number) =>
        Math.round((start + value) / scene.gridSize) * scene.gridSize - start
      move = {
        x: snap(anchor.x - (anchor.width * anchor.scaleX) / 2, delta.x),
        y: snap(anchor.y - (anchor.height * anchor.scaleY) / 2, delta.y),
      }
    }
    move = clampMove(scene, selectedIds, move)
    return { delta: move, result: editor.canExecute(moveObjects(selectedIds, move)) }
  },
}))
