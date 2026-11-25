// Store edytora map (F-25). Trzyma instancję silnika i stan widoku.
// Komponenty nie wołają silnika bezpośrednio, tylko akcji ze store'u.
// Scena w store jest kopią z silnika: odświeża ją subscribe, więc po każdym execute,
// undo i redo komponenty, które jej używają, renderują się od nowa.
import { create } from 'zustand'
import type { TranslationKey } from '@/i18n/dictionary'
import { toast } from '@/shared/components/ui/Toast/toast'
import { ApiError, api } from '@/shared/lib/apiClient'
import type { Asset } from '@/shared/lib/assets'
import {
  addLayer,
  addObject,
  addObjects,
  combineCommands,
  createEditor,
  EngineError,
  moveLayer,
  moveObjects,
  removeLayer,
  removeObjects,
  transformObjects,
  updateLayer,
  type Command,
  type Editor,
  type EngineErrorCode,
  type LayerChanges,
  type PlaceResult,
  type Point,
  type Rect,
  type Scene,
  type SceneObject,
  type Transform,
} from '../engine/engine'
import { clampOffset, fitView, toScenePoint, zoomAt, type Size } from '../view'

// Narzędzie z panelu „Narzędzia”: zaznaczanie (V) albo malowanie assetem wybranym w palecie:
// pędzel (B), prostokąt (R) i wiadro (G). Gumka (E) usuwa obiekty pod kursorem.
export type Tool = 'select' | 'brush' | 'rect' | 'fill' | 'eraser'

interface EditorState {
  editor: Editor | null
  scene: Scene | null
  // Czy w historii silnika jest co cofnąć i ponowić (przyciski w pasku narzędzi).
  canUndo: boolean
  canRedo: boolean
  selectedIds: string[]
  tool: Tool
  activeLayerId: string | null
  // Przełącznik z panelu warstw: pozostałe warstwy przygaszone, żeby było widać, z czym obiekt
  // może kolidować (kolizje są tylko w obrębie jednej warstwy).
  highlightActiveLayer: boolean
  // Warstwa pod myszą: najechana w panelu warstw albo warstwa obiektu pod kursorem na mapie.
  // Panel podświetla jej wiersz, a canvas obrysowuje jej obiekty. Null: mysz nie wskazuje warstwy.
  hoveredLayerId: string | null
  setHoveredLayer: (layerId: string | null) => void
  // Id najwyższej widocznej warstwy, której obiekt leży pod punktem sceny. Liczy też warstwy
  // zablokowane (inaczej niż objectAt), bo podgląd ma pokazać, gdzie leży każdy widoczny obiekt.
  layerAt: (point: Point) => string | null
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
  // Zapis projektu. projectId: id projektu w backendzie, null dla mapy jeszcze niezapisanej.
  projectId: string | null
  // Scena z chwili ostatniego zapisu albo wczytania. Niezapisane zmiany: hasUnsavedChanges.
  savedScene: Scene | null
  saving: boolean
  // Id projektu, który właśnie pobieramy z backendu, albo null.
  openingId: string | null

  // projectId podajemy przy wczytaniu zapisanego projektu, nowa mapa go nie ma.
  loadScene: (scene: Scene, projectId?: string | null) => void
  // Pierwszy zapis tworzy projekt (POST), kolejne go nadpisują (PUT). Przy błędzie rzuca ApiError,
  // więc wywołujący pokazuje toast.error(err.messageKey). W trakcie zapisu kolejne wywołania nic nie robią.
  save: () => Promise<void>
  // Pobiera zapisany projekt i wczytuje go do edytora. Przy błędzie rzuca ApiError
  // (np. errors.projectNotFound), a w edytorze zostaje poprzednia scena.
  openProject: (id: string) => Promise<void>
  execute: (command: Command) => PlaceResult
  undo: () => void
  redo: () => void
  // Gdy wszystkie zaznaczone obiekty leżą na jednej warstwie, ta warstwa staje się aktywna
  // (tak samo przy chwyceniu obiektu, kliknięciu i zaznaczaniu prostokątem).
  select: (ids: string[]) => void
  // Kliknięcie w punkt sceny: zaznacza najwyższy obiekt pod nim, a w puste miejsce czyści zaznaczenie.
  // Warstwa trafionego obiektu staje się aktywna, żeby panel warstw pokazywał, gdzie on jest.
  // toggle (Shift): dodaje obiekt do zaznaczenia albo go z niego zdejmuje, pustego miejsca nie liczy.
  // Zwraca id trafionego obiektu albo null, gdy kliknięto w puste miejsce.
  selectAt: (point: Point, toggle: boolean) => string | null
  // Id najwyższego obiektu z widocznych warstw pod punktem sceny, bez zmiany zaznaczenia.
  objectAt: (point: Point) => string | null
  // Prostokąt zaznaczenia w punktach sceny. add (Shift): dokłada do obecnego zaznaczenia.
  selectInRect: (rect: Rect, add: boolean) => void
  setTool: (tool: Tool) => void
  setActiveLayer: (layerId: string) => void
  // Panel warstw (F-35). Każda akcja to jeden krok cofania, błąd silnika (np. LAST_LAYER) daje toast.
  // Nowa warstwa staje na wierzchu i od razu jest aktywna.
  addLayer: (name: string) => void
  setHighlightActiveLayer: (highlight: boolean) => void
  removeLayer: (layerId: string) => void
  // Pozycja jak w silniku: 0 to najniższa warstwa.
  moveLayer: (layerId: string, toIndex: number) => void
  // Nazwa, widoczność albo blokada.
  updateLayer: (layerId: string, changes: LayerChanges) => void
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
  // Podgląd dodania assetu w punkcie sceny, bez zmiany sceny: gdzie stanie jego środek i czy koliduje.
  // painted: środki obiektów namalowanych już w tym pociągnięciu pędzla, jeszcze nie w scenie.
  planAdd: (asset: Asset, at: Point, painted?: Point[]) => { at: Point; result: PlaceResult }
  // Stawia obiekty pociągnięcia pędzla (gotowe środki z planAdd) jednym krokiem cofania.
  addPainted: (asset: Asset, centers: Point[]) => PlaceResult
  // Asset przeciągany właśnie z palety na mapę. Upuszczenie obsługuje MapCanvas.
  placingAsset: Asset | null
  setPlacingAsset: (asset: Asset | null) => void
  // Asset wybrany w palecie, którym malują narzędzia (pędzel). Null: jeszcze nic nie wybrano.
  brush: Asset | null
  setBrush: (asset: Asset | null) => void
  // Punkt mapy pod kursorem (całe piksele sceny) dla paska narzędzi. Null, gdy kursor jest poza mapą.
  cursorPoint: Point | null
  setCursorPoint: (point: Point | null) => void
  // Scena narysowana na canvasie w trakcie przeciągania, obracania albo skalowania (jeszcze
  // niezapisana). Panel właściwości pokazuje z niej wartości na bieżąco. Null: nic się nie dzieje.
  preview: Scene | null
  setPreview: (preview: Scene | null) => void
  // Przesuwa zaznaczone obiekty o wektor w punktach sceny, jednym krokiem cofania.
  // Wektor jest przycinany tak, żeby cała grupa została w granicach mapy.
  moveSelected: (delta: Point) => PlaceResult
  // Usuwa zaznaczone obiekty jednym krokiem cofania. Zaznaczenie czyści subscribe.
  deleteSelected: () => void
  // Podgląd przeciągania zaznaczonych obiektów, bez zmiany sceny. Zwraca wektor po przyciąganiu
  // (lewy górny róg obiektu `anchorId` trafia na siatkę) i przycięciu do mapy oraz wynik kolizji.
  planMove: (delta: Point, anchorId: string) => { delta: Point; result: PlaceResult }
  // Podgląd obrotu i skali jednego obiektu, bez zmiany sceny. Zwraca wartości gotowe do zapisu
  // (obrót 0–359 w pełnych stopniach, rozmiar po skali w pełnych pikselach) i wynik kolizji.
  planTransform: (id: string, transform: Transform) => { transform: Transform; result: PlaceResult }
  // Zapisuje obrót i skalę jednego obiektu jednym krokiem cofania (te same zaokrąglenia).
  transformObject: (id: string, transform: Transform) => PlaceResult
  // Zmiana z panelu właściwości: te same wartości dla wszystkich obiektów ids (każdy obraca się
  // i skaluje wokół własnego środka), jednym krokiem cofania. Zaokrąglenia jak przy uchwytach.
  // Wszystko albo nic: skala w granicach MIN_SCALE–MAX_SCALE, każdy obiekt w całości na mapie
  // i bez kolizji. Zwraca klucz błędu albo null, gdy się udało.
  editObjects: (ids: string[], changes: Partial<Transform>) => TranslationKey | null
  // Zmiana X albo Y grupy z panelu: przesuwa obiekty ids tak, żeby środek ich wspólnego
  // prostokąta (groupCenter) stanął w podanym punkcie, jednym krokiem cofania.
  // Jak editObjects: poza mapę albo na inny obiekt nic się nie zmienia i wraca klucz błędu.
  moveGroupTo: (ids: string[], target: Partial<Point>) => TranslationKey | null
}

// Tłumaczenia błędów silnika. Silnik rzuca EngineError, gdy polecenie łamie regułę inną niż
// kolizja (np. obiekt na zablokowanej warstwie). Kolizja nie jest błędem, tylko wynikiem { ok: false }.
const ENGINE_ERRORS: Record<EngineErrorCode, TranslationKey> = {
  LAYER_LOCKED: 'errors.layerLocked',
  LAST_LAYER: 'errors.lastLayer',
  LAYER_NOT_FOUND: 'errors.layerNotFound',
  OBJECT_NOT_FOUND: 'errors.objectNotFound',
  LAYER_LIMIT: 'errors.layerLimit',
  INVALID_SCENE_SIZE: 'errors.invalidSceneSize',
}

// Wywołuje silnik i zamienia EngineError na „nie udało się”, żeby błąd nie wywrócił edytora.
// Scena zostaje bez zmian. notify: pokaż toast (przy zapisie zmiany, nie przy podglądzie).
function tryEngine(run: () => PlaceResult, notify: boolean): PlaceResult {
  try {
    return run()
  } catch (err) {
    if (!(err instanceof EngineError)) throw err
    if (notify) toast.error(ENGINE_ERRORS[err.code])
    return { ok: false, collidesWith: [] }
  }
}

// Ile pierścieni pól wokół środka widoku sprawdzamy przy szukaniu wolnego miejsca.
const FREE_SPOT_RINGS = 8

// Środek nowego obiektu: z przyciąganiem lewy górny róg trafia w siatkę,
// a cały obiekt zostaje w granicach mapy. To decyzja frontendu: backend sprawdza tylko
// środek obiektu (rozdz. 5.5), więc przyjąłby też obiekt, który częściowo wystaje.
function placeAsset(target: Point, asset: Asset, scene: Scene, snap: boolean): Point {
  const axis = (value: number, size: number, max: number) => {
    // Pixel art: lewy górny róg zawsze na całym pikselu, także przy zoomie bez przyciągania.
    let start = Math.round(value - size / 2)
    if (snap) start = Math.round(start / scene.gridSize) * scene.gridSize
    start = Math.max(0, Math.min(max - size, start))
    return start + size / 2
  }
  return {
    x: axis(target.x, asset.width, scene.width),
    y: axis(target.y, asset.height, scene.height),
  }
}

// Prostokąt otaczający obiekt na mapie. Obrócony obiekt zajmuje prostokąt wokół obróconych narożników.
function objectBox(object: SceneObject) {
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
}

// Prostokąt otaczający obiekty ids (od lewego górnego rogu) albo null, gdy żadnego nie ma.
export function groupBox(scene: Scene, ids: string[]): Rect | null {
  const boxes = scene.layers
    .flatMap((layer) => layer.objects)
    .filter((object) => ids.includes(object.id))
    .map(objectBox)
  if (boxes.length === 0) return null
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.right)) - x,
    height: Math.max(...boxes.map((b) => b.bottom)) - y,
  }
}

// Środek prostokąta otaczającego obiekty ids: położenie grupy w panelu właściwości
// i w etykiecie przy przeciąganiu kilku obiektów.
export function groupCenter(scene: Scene, ids: string[]): Point | null {
  const box = groupBox(scene, ids)
  return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

// Dosuwa do mapy obiekty, które z niej wystają. Backend sprawdza tylko środek obiektu,
// więc w zapisanym albo zaimportowanym projekcie obiekt może częściowo wystawać,
// a edytor zakłada, że każdy obiekt jest w całości na mapie (clampMove).
// Obiekt większy od mapy stawiamy na jej środku. Kolizji po dosunięciu nie sprawdzamy.
function fitObjectsInMap(scene: Scene): Scene {
  const axis = (value: number, start: number, end: number, size: number) => {
    if (end - start > size) return size / 2
    // Jak w clampMove: przesunięcie do pół piksela w stronę środka mapy.
    if (start < 0) return value + Math.ceil(-start * 2) / 2
    if (end > size) return value - Math.ceil((end - size) * 2) / 2
    return value
  }
  return {
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      objects: layer.objects.map((object) => {
        const box = objectBox(object)
        return {
          ...object,
          x: axis(object.x, box.x, box.right, scene.width),
          y: axis(object.y, box.y, box.bottom, scene.height),
        }
      }),
    })),
  }
}

// Przycina wektor przesunięcia tak, żeby obiekty ids nie wyszły poza mapę. Tak jak w placeAsset
// to decyzja frontendu (backend sprawdza tylko środek).
function clampMove(scene: Scene, ids: string[], delta: Point): Point {
  const boxes = scene.layers
    .flatMap((layer) => layer.objects)
    .filter((object) => ids.includes(object.id))
    .map(objectBox)
  if (boxes.length === 0) return { x: 0, y: 0 }
  // Zakłada, że obiekty już są w całości na mapie: edytor nie pozwala postawić ich inaczej.
  // Sceny z backendu mogą mieć obiekty wystające, bo backend sprawdza tylko środek,
  // dlatego openProject dosuwa je do mapy (fitObjectsInMap).
  // Granice obróconego obiektu wychodzą z sinusa, np. 45,2548… Zaokrąglamy je do pół piksela
  // w stronę środka mapy, żeby x i y zostały na pół pikselu, tak jak po normalizeTransform.
  const clamp = (value: number, min: number, max: number) =>
    Math.max(Math.ceil(min * 2) / 2, Math.min(Math.floor(max * 2) / 2, value))
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

// Granice skali z walidacji backendu (backend/src/config.py). Obrót backend przyjmuje od 0 do 360.
export const MIN_SCALE = 0.1
export const MAX_SCALE = 10

// Zaokrągla obrót i skalę tak, żeby backend je przyjął, a obiekt został pixel artem.
function normalizeTransform(object: SceneObject, transform: Transform): Transform {
  // Rozmiar po skali w pełnych pikselach, w granicach backendu.
  const scale = (value: number, size: number) => {
    const pixels = Math.min(
      Math.max(Math.round(value * size), Math.ceil(MIN_SCALE * size)),
      Math.floor(MAX_SCALE * size)
    )
    return pixels / size
  }
  return {
    // Środek na pełnym albo pół piksela, bo przy nieparzystym rozmiarze róg i tak jest na pełnym.
    x: Math.round(transform.x * 2) / 2,
    y: Math.round(transform.y * 2) / 2,
    // Konva podaje obrót od −180 do 180, a backend chce 0–360.
    rotation: ((Math.round(transform.rotation) % 360) + 360) % 360,
    scaleX: scale(transform.scaleX, object.width),
    scaleY: scale(transform.scaleY, object.height),
  }
}

// Czy scena zmieniła się od ostatniego zapisu albo wczytania. Silnik po każdej zmianie daje nowy
// obiekt sceny, więc wystarczy porównać referencje. Cofnięcie do zapisanego stanu też liczy się
// jako zmiana, bo to już inny obiekt.
export const hasUnsavedChanges = (state: EditorState) => state.scene !== state.savedScene

// Warstwa, na którą trafiają nowe obiekty po wczytaniu sceny albo po zniknięciu aktywnej:
// najwyższa niezablokowana. Gdy wszystkie są zablokowane, bierzemy najwyższą,
// a silnik przy dodaniu zgłosi LAYER_LOCKED.
function defaultLayerId(scene: Scene): string | null {
  return (scene.layers.findLast((l) => !l.locked) ?? scene.layers.at(-1))?.id ?? null
}

// Czy punkt sceny leży w obiekcie, z obrotem i skalą: obracamy punkt odwrotnie wokół środka
// obiektu i sprawdzamy zwykły prostokąt.
function containsPoint(object: SceneObject, point: Point): boolean {
  const angle = (-object.rotation * Math.PI) / 180
  const dx = point.x - object.x
  const dy = point.y - object.y
  const x = dx * Math.cos(angle) - dy * Math.sin(angle)
  const y = dx * Math.sin(angle) + dy * Math.cos(angle)
  return (
    Math.abs(x) <= (object.width * object.scaleX) / 2 &&
    Math.abs(y) <= (object.height * object.scaleY) / 2
  )
}

// Id warstwy, na której leży obiekt, albo null.
function layerIdOf(scene: Scene | null, objectId: string): string | null {
  return scene?.layers.find((layer) => layer.objects.some((o) => o.id === objectId))?.id ?? null
}

// Wypisuje store z poprzedniego silnika przy wczytaniu nowej sceny.
let unsubscribe: (() => void) | null = null

export const useEditorStore = create<EditorState>()((set, get) => ({
  editor: null,
  scene: null,
  canUndo: false,
  canRedo: false,
  selectedIds: [],
  tool: 'select',
  activeLayerId: null,
  highlightActiveLayer: false,
  hoveredLayerId: null,
  zoom: 1,
  offset: { x: 0, y: 0 },
  viewport: { width: 0, height: 0 },
  gridVisible: true,
  gridSnap: true,
  assets: [],
  assetsError: null,
  assetsStatus: 'idle',
  placingAsset: null,
  brush: null,
  cursorPoint: null,
  preview: null,
  projectId: null,
  savedScene: null,
  saving: false,
  openingId: null,

  loadScene(scene, projectId = null) {
    unsubscribe?.()
    const editor = createEditor(scene)
    unsubscribe = editor.subscribe((next) => {
      // Po cofnięciu dodania obiekt znika ze sceny, więc nie może zostać zaznaczony.
      const ids = new Set(next.layers.flatMap((layer) => layer.objects.map((o) => o.id)))
      // Aktywna warstwa mogła zniknąć (usunięcie albo cofnięcie jej dodania).
      const { activeLayerId } = get()
      const activeExists = next.layers.some((layer) => layer.id === activeLayerId)
      set({
        scene: next,
        selectedIds: get().selectedIds.filter((id) => ids.has(id)),
        activeLayerId: activeExists ? activeLayerId : defaultLayerId(next),
        // Usunięta warstwa nie dostanie już zdarzenia zjechania myszą z jej wiersza.
        hoveredLayerId: next.layers.some((l) => l.id === get().hoveredLayerId)
          ? get().hoveredLayerId
          : null,
        canUndo: editor.canUndo(),
        canRedo: editor.canRedo(),
      })
    })
    set({
      editor,
      scene: editor.getScene(),
      canUndo: false,
      canRedo: false,
      savedScene: editor.getScene(),
      projectId,
      selectedIds: [],
      activeLayerId: defaultLayerId(scene),
    })
    get().fitToScreen()
  },

  execute(command) {
    const { editor } = get()
    if (!editor) throw new Error('No scene loaded')
    return tryEngine(() => editor.execute(command), true)
  },
  undo: () => get().editor?.undo(),
  redo: () => get().editor?.redo(),

  select(ids) {
    set({ selectedIds: ids })
    const layers = new Set(ids.map((id) => layerIdOf(get().scene, id)))
    if (layers.size === 1) set({ activeLayerId: [...layers][0] })
  },
  selectAt(point, toggle) {
    const { selectedIds } = get()
    const hit = get().objectAt(point)
    if (hit) set({ activeLayerId: layerIdOf(get().scene, hit) })
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
    get().select(add ? [...new Set([...selectedIds, ...ids])] : ids)
  },
  setTool: (tool) => set({ tool }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  addLayer(name) {
    if (!get().execute(addLayer(name)).ok) return
    set({ activeLayerId: get().scene?.layers.at(-1)?.id ?? null })
  },
  setHighlightActiveLayer: (highlightActiveLayer) => set({ highlightActiveLayer }),
  setHoveredLayer(layerId) {
    // Ruch myszy w obrębie tej samej warstwy niczego nie zmienia, więc nie odświeżamy panelu.
    if (get().hoveredLayerId !== layerId) set({ hoveredLayerId: layerId })
  },
  layerAt(point) {
    const layers = get().scene?.layers ?? []
    const top = layers.findLast(
      (layer) => layer.visible && layer.objects.some((o) => containsPoint(o, point))
    )
    return top?.id ?? null
  },
  removeLayer: (layerId) => void get().execute(removeLayer(layerId)),
  moveLayer: (layerId, toIndex) => void get().execute(moveLayer(layerId, toIndex)),
  updateLayer: (layerId, changes) => void get().execute(updateLayer(layerId, changes)),
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

  async save() {
    const { editor, scene, projectId, saving } = get()
    if (!scene || saving) return
    set({ saving: true })
    try {
      // Wysyłamy całą scenę. Backend przy POST nadaje nowe id i daty, ale sceny w edytorze
      // nie podmieniamy odpowiedzią: id projektu trzymamy osobno, a w trakcie zapisu
      // użytkownik mógł już coś zmienić.
      const saved = projectId
        ? await api.put<Scene>(`/api/projects/${projectId}`, scene)
        : await api.post<Scene>('/api/projects', scene)
      // W trakcie zapisu wczytano inną mapę: wynik dotyczy poprzedniej.
      if (get().editor !== editor) return
      // Zapisana jest wysłana scena. Zmiany zrobione w trakcie zapisu zostają niezapisane.
      set({ projectId: saved.id, savedScene: scene })
    } finally {
      set({ saving: false })
    }
  },

  async openProject(id) {
    set({ openingId: id })
    try {
      const scene = await api.get<Scene>(`/api/projects/${id}`)
      // W międzyczasie otwarto inny projekt: ten wynik jest już nieaktualny.
      if (get().openingId !== id) return
      get().loadScene(fitObjectsInMap(scene), id)
    } finally {
      if (get().openingId === id) set({ openingId: null })
    }
  },

  planAdd(asset, at, painted = []) {
    const { scene, editor, activeLayerId, gridSnap } = get()
    if (!scene || !editor || !activeLayerId) throw new Error('No scene loaded')
    const center = placeAsset(at, asset, scene, gridSnap)
    const command = addObjects(activeLayerId, asset, [...painted, center])
    return { at: center, result: tryEngine(() => editor.canExecute(command), false) }
  },
  addPainted(asset, centers) {
    const { activeLayerId } = get()
    if (!activeLayerId) throw new Error('No scene loaded')
    return get().execute(addObjects(activeLayerId, asset, centers))
  },
  setPlacingAsset: (placingAsset) => set({ placingAsset }),
  setPreview: (preview) => set({ preview }),
  setBrush: (brush) => set({ brush }),

  setCursorPoint(point) {
    const current = get().cursorPoint
    // Ruch w obrębie tego samego piksela sceny niczego nie zmienia, więc nie odświeżamy paska.
    if (current?.x === point?.x && current?.y === point?.y) return
    set({ cursorPoint: point })
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

  deleteSelected() {
    const { selectedIds } = get()
    if (selectedIds.length > 0) get().execute(removeObjects(selectedIds))
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
    const command = moveObjects(selectedIds, move)
    return { delta: move, result: tryEngine(() => editor.canExecute(command), false) }
  },

  planTransform(id, transform) {
    const { scene, editor } = get()
    const object = scene?.layers.flatMap((layer) => layer.objects).find((o) => o.id === id)
    if (!editor || !object) return { transform, result: { ok: true } }
    const next = normalizeTransform(object, transform)
    return { transform: next, result: tryEngine(() => editor.canPlace(id, next), false) }
  },

  transformObject(id, transform) {
    // execute sam sprawdza kolizję i przy niej niczego nie zmienia.
    const { transform: next } = get().planTransform(id, transform)
    return get().execute(transformObjects([id], next))
  },

  editObjects(ids, changes) {
    const { scene } = get()
    if (!scene) return null
    // Skala spoza granic backendu to błąd, a nie ciche przycięcie (np. wpisane -3).
    const scales = [changes.scaleX, changes.scaleY].filter((v) => v !== undefined)
    if (scales.some((v) => v < MIN_SCALE || v > MAX_SCALE)) return 'errors.scaleOutOfRange'
    const commands: Command[] = []
    for (const object of scene.layers.flatMap((layer) => layer.objects)) {
      if (!ids.includes(object.id)) continue
      const { x, y, rotation, scaleX, scaleY } = object
      const transform = normalizeTransform(object, { x, y, rotation, scaleX, scaleY, ...changes })
      const box = objectBox({ ...object, ...transform })
      // Zapas na zaokrąglenia sinusa przy obrocie.
      const outside =
        box.x < -0.01 ||
        box.y < -0.01 ||
        box.right > scene.width + 0.01 ||
        box.bottom > scene.height + 0.01
      if (outside) return 'errors.objectOutOfBounds'
      commands.push(transformObjects([object.id], transform))
    }
    // Obiekty po kolei, więc każdy sprawdza kolizje także z już zmienionymi sąsiadami.
    // execute przy kolizji niczego nie zmienia.
    return get().execute(combineCommands(commands)).ok ? null : 'errors.collision'
  },

  moveGroupTo(ids, target) {
    const { scene } = get()
    const center = scene && groupCenter(scene, ids)
    if (!scene || !center) return null
    // Do pół piksela, żeby środki obiektów zostały na pół pikselu jak po normalizeTransform.
    const delta = {
      x: Math.round(((target.x ?? center.x) - center.x) * 2) / 2,
      y: Math.round(((target.y ?? center.y) - center.y) * 2) / 2,
    }
    // Zerowy wektor też zapisujemy: panel na żywo zastępuje nim poprzedni krok (powrót do środka).
    // clampMove przycina wektor do mapy, więc inny wektor znaczy, że grupa by z niej wyszła.
    const allowed = clampMove(scene, ids, delta)
    if (allowed.x !== delta.x || allowed.y !== delta.y) return 'errors.objectOutOfBounds'
    return get().execute(moveObjects(ids, delta)).ok ? null : 'errors.collision'
  },
}))
