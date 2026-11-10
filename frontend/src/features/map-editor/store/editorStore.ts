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

  loadScene: (scene: Scene) => void
  execute: (command: Command) => PlaceResult
  undo: () => void
  redo: () => void
  select: (ids: string[]) => void
  setTool: (tool: Tool) => void
  setActiveLayer: (layerId: string) => void
  setView: (view: { zoom?: number; offset?: Point }) => void
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
      zoom: 1,
      offset: { x: 0, y: 0 },
    })
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
  setView: (view) => set(view),
}))
