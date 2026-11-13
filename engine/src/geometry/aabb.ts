import { EPSILON } from '../math/epsilon';
import type { Corners } from './corners';

/** Prostokąt otaczający, nieobrócony (Axis-Aligned Bounding Box). */
export interface AABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/** Najmniejszy nieobrócony prostokąt, w którym mieszczą się wszystkie narożniki. */
export function getAABB(corners: Corners): AABB {
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

/** Czy dwa prostokąty otaczające na siebie nachodzą. Stykanie się krawędziami to nie kolizja. */
export function aabbOverlap(a: AABB, b: AABB): boolean {
    return (
        a.minX < b.maxX - EPSILON &&
        b.minX < a.maxX - EPSILON &&
        a.minY < b.maxY - EPSILON &&
        b.minY < a.maxY - EPSILON
    );
}