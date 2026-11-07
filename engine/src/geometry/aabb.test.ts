import { describe, expect, it } from 'vitest';
import { aabbOverlap, getAABB } from './aabb';
import { getCorners } from './corners';

const square = { x: 100, y: 100, width: 20, height: 20, rotation: 0, scaleX: 1, scaleY: 1 };

describe('getAABB', () => {
    it('dla nieobróconego obiektu to jego własny prostokąt', () => {
        expect(getAABB(getCorners(square))).toEqual({ minX: 90, minY: 90, maxX: 110, maxY: 110 });
    });

    it('obrót o 45° powiększa prostokąt otaczający', () => {
        const box = getAABB(getCorners({ ...square, rotation: 45 }));
        // Przekątna kwadratu 20 × 20 to około 28,28, więc połowa to 14,14.
        expect(box.minX).toBeCloseTo(85.86);
        expect(box.maxX).toBeCloseTo(114.14);
    });
});

describe('aabbOverlap', () => {
    const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

    it('nachodzące prostokąty kolidują', () => {
        expect(aabbOverlap(a, { minX: 5, minY: 5, maxX: 15, maxY: 15 })).toBe(true);
    });

    it('prostokąty stykające się krawędzią nie kolidują', () => {
        expect(aabbOverlap(a, { minX: 10, minY: 0, maxX: 20, maxY: 10 })).toBe(false);
    });

    it('odległe prostokąty nie kolidują', () => {
        expect(aabbOverlap(a, { minX: 50, minY: 50, maxX: 60, maxY: 60 })).toBe(false);
    });
});