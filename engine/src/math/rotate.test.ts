import { describe, expect, it } from 'vitest';
import { rotatePoint } from './rotate';

const origin = { x: 0, y: 0 };

describe('rotatePoint', () => {
    it('obrót o 90° przenosi punkt z prawej na dół (zgodnie z zegarem)', () => {
        const p = rotatePoint({ x: 1, y: 0 }, origin, 90);
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(1);
    });

    it('obrót o 180° odwraca punkt na drugą stronę', () => {
        const p = rotatePoint({ x: 2, y: 3 }, origin, 180);
        expect(p.x).toBeCloseTo(-2);
        expect(p.y).toBeCloseTo(-3);
    });

    it('obrót o 360° wraca na to samo miejsce', () => {
        const p = rotatePoint({ x: 5, y: 7 }, origin, 360);
        expect(p.x).toBeCloseTo(5);
        expect(p.y).toBeCloseTo(7);
    });

    it('obraca wokół podanego środka, nie wokół (0, 0)', () => {
        const p = rotatePoint({ x: 110, y: 100 }, { x: 100, y: 100 }, 90);
        expect(p.x).toBeCloseTo(100);
        expect(p.y).toBeCloseTo(110);
    });

    it('środek obrotu zostaje na miejscu', () => {
        const c = { x: 50, y: 50 };
        const p = rotatePoint(c, c, 45);
        expect(p.x).toBeCloseTo(50);
        expect(p.y).toBeCloseTo(50);
    });
});