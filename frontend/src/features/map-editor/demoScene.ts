// Tymczasowa scena do podglądu canvasu. Zniknie, gdy dojdzie okno „Nowa mapa” (F-30).
// Assetów jeszcze nie ma, więc obiekty rysują się jako prostokąty zastępcze.
import type { Scene, SceneObject } from './engine/engine'

function object(id: string, x: number, y: number, extra: Partial<SceneObject> = {}): SceneObject {
  return {
    id,
    assetId: 'demo',
    x,
    y,
    width: 64,
    height: 64,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    ...extra,
  }
}

export const demoScene: Scene = {
  schemaVersion: 1,
  id: 'demo',
  type: 'map',
  name: 'Demo',
  width: 640,
  height: 480,
  gridSize: 32,
  background: { color: '#7ec850' },
  layers: [
    {
      id: 'ground',
      name: 'Ziemia',
      visible: true,
      locked: false,
      objects: [object('log', 160, 160, { width: 128, height: 32 }), object('rock', 480, 352)],
    },
    {
      id: 'top',
      name: 'Góra',
      visible: true,
      locked: false,
      // Drzewo częściowo zasłania kłodę z niższej warstwy, a drugie jest obrócone i powiększone.
      objects: [object('tree', 192, 160), object('bush', 352, 224, { rotation: 45, scaleX: 1.5 })],
    },
  ],
  createdAt: '2026-11-15T00:00:00Z',
  updatedAt: '2026-11-15T00:00:00Z',
}
