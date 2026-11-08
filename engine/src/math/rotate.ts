import { degToRad } from './angle';
import { add, sub, type Vec2 } from './vec2';

/**
 * Obraca punkt wokół środka o podany kąt w stopniach.
 */
export function rotatePoint(point: Vec2, center: Vec2, degrees: number): Vec2 {
    const angle = degToRad(degrees);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // 1. Przesuwamy punkt tak, jakby środek był w (0, 0).
    const d = sub(point, center);

    // 2. Obracamy wokół (0, 0) wzorem na obrót.
    const rotated: Vec2 = {
        x: d.x * cos - d.y * sin,
        y: d.x * sin + d.y * cos,
    };

    // 3. Przesuwamy z powrotem na miejsce.
    return add(rotated, center);
}