import { rotatePoint } from '../math/rotate';
import type { Vec2 } from '../math/vec2';
import { EPSILON } from './aabb';
import type { Shape } from './corners';

export function pointInShape(point: Vec2, shape: Shape): boolean {
    const center = { x: shape.x, y: shape.y };
    // Obracamy punkt w przeciwną stronę niż obiekt. Wtedy obiekt jest „prosty”
    // i wystarczy sprawdzić, czy punkt mieści się w zwykłym prostokącie.
    const local = rotatePoint(point, center, -shape.rotation);

    const hw = (shape.width * shape.scaleX) / 2;
    const hh = (shape.height * shape.scaleY) / 2;

    return Math.abs(local.x - shape.x) <= hw + EPSILON && Math.abs(local.y - shape.y) <= hh + EPSILON;
}