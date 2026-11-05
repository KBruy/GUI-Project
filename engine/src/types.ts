// Kontrakt danych (rozdział 5 dokumentu technicznego).
// Te same pola są w backendzie: backend/src/schemas/scene.py i asset.py.

/** Moduł edytora: mapa albo postać. */
export type SceneType = 'map' | 'character';

/** Obecna wersja formatu sceny. */
export const SCHEMA_VERSION = 1;

/** Rozmiar pola siatki w pikselach. */
export const GRID_SIZE = 32;

/** Maksymalna liczba warstw w scenie. */
export const MAX_LAYERS = 10;

/** Obiekt na scenie: odwołanie do assetu z położeniem i przekształceniem. */
export interface SceneObject {
    id: string;
    assetId: string;
    /** Środek obiektu w pikselach sceny. (0, 0) to lewy górny róg, Y rośnie w dół. */
    x: number;
    y: number;
    /** Rozmiar bazowy z assetu. Rozmiar na scenie to width * scaleX na height * scaleY. */
    width: number;
    height: number;
    /** Stopnie, zgodnie z ruchem wskazówek zegara, 0–360. */
    rotation: number;
    /** Mnożniki skali, 1 = rozmiar oryginalny, zakres 0,1–10. */
    scaleX: number;
    scaleY: number;
}

/** Warstwa sceny. Obiekty rysujemy w kolejności z tablicy. */
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    objects: SceneObject[];
}

/** Cała scena: mapa albo postać. Ten sam obiekt trafia do bazy i do pliku eksportu. */
export interface Scene {
    /** Wersja formatu. Silnik i backend obsługują tylko SCHEMA_VERSION. */
    schemaVersion: number;
    /** UUID. */
    id: string;
    type: SceneType;
    name: string;
    /** Rozmiar sceny w pikselach, np. 40 pól * 32 px = 1280. */
    width: number;
    height: number;
    gridSize: typeof GRID_SIZE;
    /** Kolor tła w formacie "#rrggbb". */
    background: { color: string };
    /** Indeks 0 to najniższa warstwa. Najwyżej MAX_LAYERS warstw. */
    layers: Layer[];
    /** Daty w formacie ISO 8601 ze strefą czasową, np. "2026-11-05T12:00:00Z". */
    createdAt: string;
    updatedAt: string;
}

/** Grafika z biblioteki (wpis z assets/manifest.json). */
export interface Asset {
    /** Np. "map_tree_oak_01". */
    id: string;
    module: SceneType;
    category: string;
    /** Klucz tłumaczenia nazwy, np. "assets.map.tree_oak". */
    nameKey: string;
    /** Ścieżka PNG względem folderu assetów. */
    file: string;
    width: number;
    height: number;
}