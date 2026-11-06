import { describe, expect, it } from 'vitest';
import { getCorners } from './corners';
import { satOverlap } from './sat';

const shape = (x: number, y: number, rotation = 0) =>
    getCorners({ x, y, width: 20, height: 20, rotation, scaleX: 1, scaleY: 1 });

describe('satOverlap', () => {
    it('nachodzące kwadraty kolidują', () => {
        expect(satOverlap(shape(100, 100), shape(110, 110))).toBe(true);
    });

    it('kwadraty stykające się krawędzią nie kolidują', () => {
        expect(satOverlap(shape(100, 100), shape(120, 100))).toBe(false);
    });

    it('odległe kwadraty nie kolidują', () => {
        expect(satOverlap(shape(100, 100), shape(300, 300))).toBe(false);
    });

    it('kwadraty obrócone o 45° kolidują w rogu', () => {
        // Róg rombu sięga 14,14 px w prawo (do x = 114,14), a drugi kwadrat zaczyna się na x = 110.
        expect(satOverlap(shape(100, 100, 45), shape(120, 100))).toBe(true);
    });

    it('AABB się nakładają, ale obrócone kwadraty nie (tu SAT jest potrzebny)', () => {
        // Dwa romby po skosie: prostokąty otaczające nachodzą, same kształty nie.
        expect(satOverlap(shape(100, 100, 45), shape(120, 120, 45))).toBe(false);
    });
});