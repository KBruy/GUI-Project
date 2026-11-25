import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Scene } from '@worldsmith/engine'
import type { Asset } from '@/shared/lib/assets'
import { addObject } from '../engine/engine'
import { hasUnsavedChanges, useEditorStore } from './editorStore'

const TREE = { id: 'map_tree_oak_01', width: 64, height: 64 }

function makeScene(): Scene {
  return {
    schemaVersion: 1,
    id: 'scene-1',
    type: 'map',
    name: 'Test',
    width: 640,
    height: 480,
    gridSize: 32,
    background: { color: '#7ec850' },
    layers: [
      { id: 'ground', name: 'Ziemia', visible: true, locked: false, objects: [] },
      { id: 'top', name: 'Góra', visible: true, locked: false, objects: [] },
    ],
    createdAt: '2026-11-10T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  }
}

const store = useEditorStore.getState

describe('editor store', () => {
  beforeEach(() => {
    store().loadScene(makeScene())
  })

  it('picks the top layer as active after loading a scene', () => {
    expect(store().activeLayerId).toBe('top')
  })

  it('skips a locked top layer and does not crash on engine errors', () => {
    const scene = makeScene()
    scene.layers[1].locked = true
    store().loadScene(scene)

    expect(store().activeLayerId).toBe('ground')
    // Dodanie na zablokowaną warstwę: silnik rzuca LAYER_LOCKED, store zwraca porażkę.
    expect(store().execute(addObject('top', TREE, { x: 100, y: 100 })).ok).toBe(false)
    expect(store().scene?.layers[1].objects).toHaveLength(0)
  })

  it('updates the scene in the store after executing a command', () => {
    const result = store().execute(addObject('top', TREE, { x: 100, y: 100 }))

    expect(result).toEqual({ ok: true })
    expect(store().scene?.layers[1].objects).toHaveLength(1)
  })

  describe('selection', () => {
    // Drzewo 64×64 na dolnej warstwie, nad nim drugie na górnej i trzecie obok.
    beforeEach(() => {
      store().execute(addObject('ground', TREE, { x: 100, y: 100 }))
      store().execute(addObject('top', TREE, { x: 100, y: 100 }))
      store().execute(addObject('top', TREE, { x: 300, y: 100 }))
    })
    const ids = () => store().scene!.layers.flatMap((layer) => layer.objects.map((o) => o.id))

    it('selects the topmost object under the point', () => {
      const [, top] = ids()
      store().selectAt({ x: 110, y: 90 }, false)

      expect(store().selectedIds).toEqual([top])
    })

    it('clears the selection on a click in an empty spot', () => {
      store().select(ids())
      store().selectAt({ x: 500, y: 400 }, false)

      expect(store().selectedIds).toEqual([])
    })

    it('toggles objects with shift and ignores empty spots', () => {
      const [, a, b] = ids()
      store().selectAt({ x: 100, y: 100 }, false)
      store().selectAt({ x: 300, y: 100 }, true)
      expect(store().selectedIds).toEqual([a, b])

      store().selectAt({ x: 500, y: 400 }, true)
      store().selectAt({ x: 100, y: 100 }, true)
      expect(store().selectedIds).toEqual([b])
    })

    it('selects every object touched by the rectangle', () => {
      const [ground, a, b] = ids()
      store().selectInRect({ x: 0, y: 0, width: 120, height: 120 }, false)
      expect(store().selectedIds).toEqual([ground, a])

      store().selectInRect({ x: 280, y: 80, width: 10, height: 10 }, true)
      expect(store().selectedIds).toEqual([ground, a, b])
    })

    it('skips objects on hidden layers', () => {
      const scene = store().scene!
      store().loadScene({
        ...scene,
        layers: scene.layers.map((layer) => ({ ...layer, visible: layer.id === 'ground' })),
      })
      store().selectInRect({ x: 0, y: 0, width: 640, height: 480 }, false)

      expect(store().selectedIds).toEqual([scene.layers[0].objects[0].id])
    })
  })

  it('drops removed objects from the selection on undo', () => {
    store().execute(addObject('top', TREE, { x: 100, y: 100 }))
    const id = store().scene!.layers[1].objects[0].id
    store().select([id])

    store().undo()

    expect(store().scene?.layers[1].objects).toHaveLength(0)
    expect(store().selectedIds).toEqual([])
  })

  it('keeps grid toggles when another scene is loaded', () => {
    store().setGridVisible(false)
    store().setGridSnap(false)

    store().loadScene(makeScene())

    expect(store().gridVisible).toBe(false)
    expect(store().gridSnap).toBe(false)
    // Przywracamy domyślne, bo store jest wspólny dla wszystkich testów.
    store().setGridVisible(true)
    store().setGridSnap(true)
  })

  describe('view', () => {
    beforeEach(() => {
      // Pierwszy pomiar canvasu dopasowuje scenę 640×480 do ekranu.
      useEditorStore.setState({ viewport: { width: 0, height: 0 } })
      store().setViewport({ width: 800, height: 600 })
    })

    it('fits the scene to the screen after the first measurement', () => {
      expect(store().zoom).toBeCloseTo(536 / 480)
    })

    it('zooms at the center of the canvas by default', () => {
      store().zoomTo(2)

      const { zoom, offset } = store()
      expect(zoom).toBe(2)
      // Środek canvasu (400, 300) pokazuje środek sceny (320, 240), tak jak przed zoomem.
      expect(offset.x + 320 * zoom).toBeCloseTo(400)
      expect(offset.y + 240 * zoom).toBeCloseTo(300)
    })

    it('does not pan the scene off the screen', () => {
      store().panBy(10_000, 0)

      expect(store().offset.x).toBe(800 - 64)
    })

    it('keeps the middle of the view in the middle after a resize', () => {
      const { zoom, offset } = store()
      store().setViewport({ width: 1000, height: 500 })

      // Zoom się nie zmienia, a widok przesuwa się o połowę różnicy rozmiarów.
      expect(store().zoom).toBe(zoom)
      expect(store().offset).toEqual({ x: offset.x + 100, y: offset.y - 50 })
    })

    it('keeps the scene on the screen after the canvas shrinks', () => {
      // Mapa przesunięta do prawej krawędzi, a potem canvas zwęża się do 300 px.
      store().panBy(10_000, 0)
      store().setViewport({ width: 300, height: 600 })

      expect(store().offset.x).toBe(300 - 64)
    })
  })

  describe('assets', () => {
    const ROCK: Asset = {
      id: 'map_rock_01',
      module: 'map',
      category: 'rocks',
      nameKey: 'assets.map.rock',
      file: 'map/rocks/map_rock_01.png',
      width: 32,
      height: 32,
    }

    beforeEach(() => {
      // Widok 1:1 bez przesunięcia: punkt ekranu = punkt sceny. Środek canvasu to (100, 90).
      useEditorStore.setState({
        viewport: { width: 200, height: 180 },
        zoom: 1,
        offset: { x: 0, y: 0 },
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('loads the map assets from the backend', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(JSON.stringify([ROCK]), { status: 200 })))
      )
      await store().loadAssets()
      expect(store().assets).toEqual([ROCK])
      expect(store().assetsError).toBeNull()
    })

    it('keeps the error key when the backend is down', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
      )
      await store().loadAssets()
      expect(store().assetsError).toBe('errors.network')
    })

    it('adds the asset in the middle of the view, snapped to the grid', () => {
      expect(store().addAsset(ROCK)).toEqual({ ok: true })
      // Środek (100, 90) → lewy górny róg (84, 74) → siatka (96, 64) → środek obiektu (112, 80).
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 112, y: 80 })
    })

    it('does not snap when snapping is off', () => {
      store().setGridSnap(false)
      store().addAsset(ROCK)
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 100, y: 90 })
      store().setGridSnap(true)
    })

    it('keeps the whole object inside the map', () => {
      store().addAsset(ROCK, { x: 630, y: -50 })
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 624, y: 16 })
    })

    it('refuses to add on top of another object at a given point', () => {
      store().addAsset(ROCK, { x: 100, y: 100 })
      expect(store().addAsset(ROCK, { x: 100, y: 100 })).toMatchObject({ ok: false })
      expect(store().scene!.layers[1].objects).toHaveLength(1)
    })

    it('puts the next object in the nearest free spot around the middle', () => {
      store().addAsset(ROCK)
      expect(store().addAsset(ROCK)).toEqual({ ok: true })
      const [first, second] = store().scene!.layers[1].objects
      expect(second.x !== first.x || second.y !== first.y).toBe(true)
      // Sąsiednie pole siatki, nie dalej.
      expect(Math.abs(second.x - first.x)).toBeLessThanOrEqual(32)
      expect(Math.abs(second.y - first.y)).toBeLessThanOrEqual(32)
    })
  })
  describe('moveSelected', () => {
    // Dwa drzewa 64×64 na górnej warstwie: A w (100, 100) i B w (300, 100).
    beforeEach(() => {
      store().execute(addObject('top', TREE, { x: 100, y: 100 }))
      store().execute(addObject('top', TREE, { x: 300, y: 100 }))
    })
    const objects = () => store().scene!.layers[1].objects

    it('moves all selected objects in one undo step', () => {
      store().select(objects().map((o) => o.id))

      expect(store().moveSelected({ x: 10, y: 32 })).toEqual({ ok: true })
      expect(objects()).toMatchObject([
        { x: 110, y: 132 },
        { x: 310, y: 132 },
      ])

      store().undo()
      expect(objects()).toMatchObject([
        { x: 100, y: 100 },
        { x: 300, y: 100 },
      ])
    })

    it('stops the group at the map edge', () => {
      store().select(objects().map((o) => o.id))
      store().moveSelected({ x: -500, y: 1000 })

      // Lewa krawędź A (68) dochodzi do 0, a dolna krawędź obu do 480.
      expect(objects()).toMatchObject([
        { x: 32, y: 448 },
        { x: 232, y: 448 },
      ])
    })

    it('does not move into another object on the same layer', () => {
      const [a] = objects()
      store().select([a.id])

      expect(store().moveSelected({ x: 150, y: 0 })).toMatchObject({ ok: false })
      expect(objects()[0]).toMatchObject({ x: 100, y: 100 })
    })

    it('lets objects on different layers overlap', () => {
      store().execute(addObject('ground', TREE, { x: 200, y: 300 }))
      const [a] = objects()
      store().select([a.id])

      expect(store().moveSelected({ x: 100, y: 200 })).toEqual({ ok: true })
    })
  })
  describe('planMove', () => {
    // Drzewo 64×64 w (100, 100), lewy górny róg w (68, 68), i drugie w (300, 100).
    beforeEach(() => {
      store().execute(addObject('top', TREE, { x: 100, y: 100 }))
      store().execute(addObject('top', TREE, { x: 300, y: 100 }))
      store().select([store().scene!.layers[1].objects[0].id])
      store().setGridSnap(true)
    })
    const first = () => store().scene!.layers[1].objects[0]

    it('snaps the anchor corner to the grid without changing the scene', () => {
      const before = store().scene

      // Róg 68 + 10 = 78 → najbliższa linia 64, więc wektor −4.
      expect(store().planMove({ x: 10, y: 10 }, first().id)).toEqual({
        delta: { x: -4, y: -4 },
        result: { ok: true },
      })
      expect(store().scene).toBe(before)
    })

    it('keeps the exact vector with snapping off', () => {
      store().setGridSnap(false)
      expect(store().planMove({ x: 10, y: 10 }, first().id).delta).toEqual({ x: 10, y: 10 })
    })

    it('reports a collision with an object on the same layer', () => {
      const other = store().scene!.layers[1].objects[1]
      expect(store().planMove({ x: 190, y: 0 }, first().id).result).toEqual({
        ok: false,
        collidesWith: [other.id],
      })
    })
  })

  describe('transform', () => {
    // Drzewo 64×64 w (100, 100) i drugie w (300, 100), oba na górnej warstwie.
    beforeEach(() => {
      store().execute(addObject('top', TREE, { x: 100, y: 100 }))
      store().execute(addObject('top', TREE, { x: 300, y: 100 }))
    })
    const tree = (i: number) => store().scene!.layers[1].objects[i]
    const turn = { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 }

    it('rounds the transform for the backend without changing the scene', () => {
      const before = store().scene
      const { transform } = store().planTransform(tree(0).id, {
        x: 100.3,
        y: 100.2,
        rotation: -90.4,
        scaleX: 1.51,
        scaleY: 0.05,
      })

      // Obrót 0–359, rozmiar w pełnych pikselach (97 i 7 z 64), skala nie mniejsza niż 0,1.
      expect(transform).toEqual({
        x: 100.5,
        y: 100,
        rotation: 270,
        scaleX: 97 / 64,
        scaleY: 7 / 64,
      })
      expect(store().scene).toBe(before)
    })

    it('reports a collision after scaling into another object', () => {
      // Szerokość 64 · 6 = 384, czyli do x 292: nachodzi na drugie drzewo (od 268).
      const { result } = store().planTransform(tree(0).id, { ...turn, scaleX: 6 })

      expect(result).toEqual({ ok: false, collidesWith: [tree(1).id] })
    })

    it('saves rotation and scale in one undo step', () => {
      const id = tree(0).id
      expect(store().transformObject(id, { ...turn, rotation: 45, scaleX: 2 })).toEqual({
        ok: true,
      })
      expect(tree(0)).toMatchObject({ rotation: 45, scaleX: 2 })

      store().undo()
      expect(tree(0)).toMatchObject({ rotation: 0, scaleX: 1 })
    })

    it('keeps a turned object on half pixels when it stops at the map edge', () => {
      const id = tree(0).id
      store().transformObject(id, { ...turn, rotation: 45 })
      store().select([id])
      store().moveSelected({ x: -1000, y: 0 })

      // Obrócony o 45° kwadrat 64 px ma pół szerokości 45,25…, więc staje w 45,5, a nie w 45,2548….
      expect(tree(0).x).toBe(45.5)
    })
  })

  describe('saving', () => {
    const saved = (id: string) => ({ ...makeScene(), id })
    // Odpowiada po kolei podanymi scenami i zapamiętuje wywołania.
    const stubFetch = (...scenes: Scene[]) => {
      const fetch = vi.fn()
      for (const scene of scenes) {
        fetch.mockResolvedValueOnce(new Response(JSON.stringify(scene), { status: 200 }))
      }
      vi.stubGlobal('fetch', fetch)
      return fetch
    }
    // Każde kolejne drzewo stoi obok poprzedniego, żeby nie kolidowały.
    const addTree = () => {
      const count = store().scene!.layers[1].objects.length
      expect(store().execute(addObject('top', TREE, { x: 100 + count * 64, y: 100 }))).toEqual({
        ok: true,
      })
    }

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('has no unsaved changes right after loading a scene', () => {
      expect(store().projectId).toBeNull()
      expect(hasUnsavedChanges(store())).toBe(false)
      addTree()
      expect(hasUnsavedChanges(store())).toBe(true)
    })

    it('creates the project on the first save and updates it later', async () => {
      const fetch = stubFetch(saved('p-1'), saved('p-1'))
      addTree()
      await store().save()

      expect(fetch.mock.calls[0][0]).toMatch(/\/api\/projects$/)
      expect(fetch.mock.calls[0][1].method).toBe('POST')
      expect(store().projectId).toBe('p-1')
      expect(hasUnsavedChanges(store())).toBe(false)

      addTree()
      await store().save()
      expect(fetch.mock.calls[1][0]).toMatch(/\/api\/projects\/p-1$/)
      expect(fetch.mock.calls[1][1].method).toBe('PUT')
      expect(JSON.parse(fetch.mock.calls[1][1].body).layers[1].objects).toHaveLength(2)
    })

    it('keeps changes made during the save as unsaved', async () => {
      stubFetch(saved('p-1'))
      const saving = store().save()
      addTree()
      await saving

      expect(store().projectId).toBe('p-1')
      expect(hasUnsavedChanges(store())).toBe(true)
    })

    it('sends only one request when saving twice in a row', async () => {
      const fetch = stubFetch(saved('p-1'))
      await Promise.all([store().save(), store().save()])

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(store().saving).toBe(false)
    })

    it('throws the API error and keeps the changes unsaved', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
      )
      addTree()

      await expect(store().save()).rejects.toMatchObject({ messageKey: 'errors.network' })
      expect(store().projectId).toBeNull()
      expect(store().saving).toBe(false)
      expect(hasUnsavedChanges(store())).toBe(true)
    })

    it('starts without a project id after loading a new scene', async () => {
      stubFetch(saved('p-1'))
      await store().save()
      store().loadScene(makeScene())

      expect(store().projectId).toBeNull()
    })
  })

  describe('opening a project', () => {
    // Zapisany projekt: drzewo 64×64 wystaje 20 px za prawą krawędź mapy 640×480.
    const savedProject = () => {
      const scene = makeScene()
      scene.layers[1].objects.push({
        id: 'obj-1',
        assetId: TREE.id,
        x: 628,
        y: 100,
        width: 64,
        height: 64,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      })
      return { ...scene, id: 'p-1' }
    }

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('loads the project and pushes sticking out objects into the map', async () => {
      const fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify(savedProject()))))
      vi.stubGlobal('fetch', fetch)
      const opening = store().openProject('p-1')
      expect(store().openingId).toBe('p-1')
      await opening

      expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/projects\/p-1$/), {
        method: 'GET',
      })
      expect(store().projectId).toBe('p-1')
      expect(store().openingId).toBeNull()
      expect(store().scene!.layers[1].objects[0]).toMatchObject({ x: 608, y: 100 })
      expect(hasUnsavedChanges(store())).toBe(false)
    })

    it('keeps the current scene when the project does not exist', async () => {
      const error = { code: 'PROJECT_NOT_FOUND', messageKey: 'errors.projectNotFound' }
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error }), { status: 404 })))
      )
      const scene = store().scene

      await expect(store().openProject('nope')).rejects.toMatchObject({
        messageKey: 'errors.projectNotFound',
      })
      expect(store().scene).toBe(scene)
      expect(store().openingId).toBeNull()
    })

    it('ignores a project that arrives after another one was opened', async () => {
      let answer: (response: Response) => void = () => {}
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<Response>((resolve) => (answer = resolve)))
      )
      const first = store().openProject('p-1')
      const firstAnswer = answer
      const second = store().openProject('p-2')
      answer(new Response(JSON.stringify({ ...savedProject(), id: 'p-2' })))
      await second
      firstAnswer(new Response(JSON.stringify(savedProject())))
      await first

      expect(store().projectId).toBe('p-2')
    })
  })
})
