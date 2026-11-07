import { describe, expect, it } from 'vitest';
import { GRID_SIZE, SCHEMA_VERSION } from '../types';
import { createCharacterScene, createLayer, createMapScene } from './create';

describe('createLayer', () => {
    it('tworzy pustą, widoczną warstwę', () => {
        const layer = createLayer('Drzewa');
        expect(layer.name).toBe('Drzewa');
        expect(layer.visible).toBe(true);
        expect(layer.locked).toBe(false);
        expect(layer.objects).toHaveLength(0);
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