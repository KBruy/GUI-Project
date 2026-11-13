import { describe, expect, it } from 'vitest'
import { GRID_SIZE, MAX_LAYERS, SCHEMA_VERSION, type Scene } from './index'

describe('kontrakt danych', () => {
  it('przykładowa scena pasuje do typów', () => {
    const scene: Scene = {
      schemaVersion: SCHEMA_VERSION,
      id: '00000000-0000-0000-0000-000000000001',
      type: 'map',
      name: 'Testowa mapa',
      width: 1280,
      height: 960,
      gridSize: GRID_SIZE,
      background: { color: '#7ec850' },
      layers: [
        {
          id: 'layer_1',
          name: 'Trawa',
          visible: true,
          locked: false,
          objects: [
            {
              id: 'obj_1',
              assetId: 'map_tree_oak_01',
              x: 320,
              y: 128,
              width: 64,
              height: 96,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            },
          ],
        },
      ],
      createdAt: '2026-11-05T12:00:00Z',
      updatedAt: '2026-11-05T12:00:00Z',
    }

    expect(scene.layers[0].objects).toHaveLength(1)
  })

  it('ma stałe z dokumentu technicznego', () => {
    expect(GRID_SIZE).toBe(32)
    expect(MAX_LAYERS).toBe(10)
    expect(SCHEMA_VERSION).toBe(1)
  })
})
