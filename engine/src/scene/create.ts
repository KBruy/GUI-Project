import { newId } from '../ids';
import { GRID_SIZE, SCHEMA_VERSION, type Layer, type Scene } from '../types';
import { EngineError } from '../errors';

/** Rozmiar płótna w pikselach. */
export interface SceneSize {
    width: number;
    height: number;
}

/**
 * Dozwolone rozmiary mapy: mała, średnia, duża (rozdz. 1 dokumentu technicznego).
 * Te same wartości ma backend w ALLOWED_SCENE_SIZES (backend/src/config.py).
 */
export const MAP_SIZES: readonly SceneSize[] = [
    { width: 640, height: 480 },
    { width: 1280, height: 960 },
    { width: 2048, height: 1536 },
];

/** Płótno postaci ma stały rozmiar (rozdz. 5.3 dokumentu technicznego). */
export const CHARACTER_WIDTH = 256;
export const CHARACTER_HEIGHT = 512;

/** Czy rozmiar jest jednym z dozwolonych rozmiarów mapy. */
export function isAllowedMapSize(size: SceneSize): boolean {
    return MAP_SIZES.some((allowed) => allowed.width === size.width && allowed.height === size.height);
}

/** Warstwy postaci od najniższej do najwyższej (rozdz. 5.3). */
export const CHARACTER_LAYERS:readonly string[] = ['ciało', 'spodnie', 'koszulka', 'włosy'];

/** Tworzy pustą warstwę. */
export function createLayer(name: string, locked = false): Layer {
    return { id: newId('layer'), name, visible: true, locked, objects: [] };
}

/**
 * Tworzy nową, pustą mapę z jedną warstwą.
 * Id sceny i daty są tymczasowe: przy pierwszym zapisie backend nadaje własne.
 */
export function createMapScene(name: string, size: SceneSize, layerName = 'Warstwa 1'): Scene {
    if (!isAllowedMapSize(size)) {
        throw new EngineError('INVALID_SCENE_SIZE');
    }
    const now = new Date().toISOString();
    return {
        schemaVersion: SCHEMA_VERSION,
        id: newId('scene'),
        type: 'map',
        name,
        width : size.width,
        height : size.height,
        gridSize: GRID_SIZE,
        background: { color: '#7ec850' },
        layers: [createLayer(layerName)],
        createdAt: now,
        updatedAt: now,
    };
}

/** Tworzy nową postać z czterema warstwami; warstwa ciała jest zablokowana. */
export function createCharacterScene(name: string, layerNames: readonly string[] = CHARACTER_LAYERS): Scene {
    const now = new Date().toISOString();
    return {
        schemaVersion: SCHEMA_VERSION,
        id: newId('scene'),
        type: 'character',
        name,
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        gridSize: GRID_SIZE,
        background: { color: '#ffffff' },
        layers: layerNames.map((layerName, index) => createLayer(layerName, index === 0)),
        createdAt: now,
        updatedAt: now,
    };
}