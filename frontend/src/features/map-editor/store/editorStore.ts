// Store edytora map (F-25). Trzyma instancję silnika i stan widoku.
// Komponenty nie wołają silnika bezpośrednio, tylko akcji ze store'u.
// Scena w store jest kopią z silnika: odświeża ją subscribe, więc po każdym execute,
// undo i redo komponenty, które jej używają, renderują się od nowa.
import { create } from 'zustand'
import {
  createEditor,
  type Command,
  type Editor,
  type PlaceResult,
  type Point,
  type Scene,
} from '../engine/engine'
import { clampOffset, fitView, zoomAt, type Size } from '../view'

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

  loadScene: (scene: Scene) => void
  execute: (command: Command) => PlaceResult
  undo: () => void
  redo: () => void
  select: (ids: string[]) => void
  setTool: (tool: Tool) => void
  setActiveLayer: (layerId: string) => void
  setViewport: (viewport: Size) => void
  // Zoom w punkcie ekranu (np. pod kursorem). Bez punktu: środek canvasu.
  zoomTo: (zoom: number, anchor?: Point) => void
  panBy: (dx: number, dy: number) => void
  fitToScreen: () => void
  setGridVisible: (visible: boolean) => void
  setGridSnap: (snap: boolean) => void
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
  setTool: (tool) => set({ tool }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  setViewport(viewport) {
    const first = get().viewport.width === 0
    set({ viewport })
    // Pierwszy pomiar: dopiero teraz wiadomo, jak dopasować scenę do ekranu.
    if (first) get().fitToScreen()
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
}))
