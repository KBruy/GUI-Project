import { describe, expect, it } from 'vitest';
import { GRID_SIZE, SCHEMA_VERSION } from '../types';
import { createCharacterScene, createLayer, createMapScene, isAllowedMapSize, MAP_SIZES } from './create';

describe('createLayer', () => {
    it('tworzy pustą, widoczną warstwę', () => {
        const layer = createLayer('Drzewa');
        expect(layer.name).toBe('Drzewa');
        expect(layer.visible).toBe(true);
        expect(layer.locked).toBe(false);
        expect(layer.objects).toHaveLength(0);
    });
});

describe('MAP_SIZES', () => {
    it('ma trzy rozmiary zgodne z backendem', () => {
        expect(MAP_SIZES).toEqual([
            { width: 640, height: 480 },
            { width: 1280, height: 960 },
            { width: 2048, height: 1536 },
        ]);
    });

    it('isAllowedMapSize odróżnia dozwolony rozmiar od dowolnego', () => {
        expect(isAllowedMapSize({ width: 1280, height: 960 })).toBe(true);
        expect(isAllowedMapSize({ width: 1000, height: 1000 })).toBe(false);
    });
});

describe('createMapScene', () => {
    const scene = createMapScene('Wioska', 1280, 960);

    it('ustawia pola z kontraktu danych', () => {
        expect(scene.type).toBe('map');
        expect(scene.name).toBe('Wioska');
        expect(scene.width).toBe(1280);
        expect(scene.height).toBe(960);
        expect(scene.gridSize).toBe(GRID_SIZE);
        expect(scene.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it('ma jedną pustą warstwę', () => {
        expect(scene.layers).toHaveLength(1);
        expect(scene.layers[0].objects).toHaveLength(0);
    });

    it('daty są w formacie ISO ze strefą czasową', () => {
        expect(scene.createdAt.endsWith('Z')).toBe(true);
        expect(scene.createdAt).toBe(scene.updatedAt);
    });
});

describe('createCharacterScene', () => {
    const scene = createCharacterScene('Bohater');

    it('ma stały rozmiar płótna 256 × 512', () => {
        expect(scene.type).toBe('character');
        expect(scene.width).toBe(256);
        expect(scene.height).toBe(512);
    });

    it('ma cztery warstwy w kolejności od ciała do włosów', () => {
        expect(scene.layers.map((layer) => layer.name)).toEqual(['ciało', 'spodnie', 'koszulka', 'włosy']);
    });

    it('tylko warstwa ciała jest zablokowana', () => {
        expect(scene.layers.map((layer) => layer.locked)).toEqual([true, false, false, false]);
    });

    it('każda warstwa ma inne id', () => {
        const ids = new Set(scene.layers.map((layer) => layer.id));
        expect(ids.size).toBe(4);
    });
});