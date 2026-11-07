import { describe, expect, it } from 'vitest';
import { add, sub } from './vec2';

describe('vec2', () => {
    it('dodaje wektory', () => {
        expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    });

    it('odejmuje wektory', () => {
        expect(sub({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
    });

    it('nie zmienia argumentów', () => {
        const a = { x: 1, y: 1 };
        add(a, { x: 5, y: 5 });
        expect(a).toEqual({ x: 1, y: 1 });
    });
});