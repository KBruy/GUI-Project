let counter = 0;

/**
 * Tworzy nowe id, np. "layer_mh3k2x_7".
 * Czas w systemie 36 odróżnia sesje, licznik odróżnia id utworzone w tej samej milisekundzie.
 */
export function newId(prefix: string): string {
    counter += 1;
    return `${prefix}_${Date.now().toString(36)}_${counter}`;
}