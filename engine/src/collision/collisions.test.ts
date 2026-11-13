import { describe, expect, it } from 'vitest'
import type { SceneObject } from '../types'
import { findCollisions } from './collisions'

// Kwadrat 20 × 20 o podanym id, środku i obrocie.
const square = (id: string, x: number, y: number, rotation = 0): SceneObject => ({
  id,
  assetId: 'test_square',
  x,
  y,
  width: 20,
  height: 20,
  rotation,
  scaleX: 1,
  scaleY: 1,
})

describe('findCollisions', () => {
  it('pusta lista: brak kolizji', () => {
    expect(findCollisions([], square('new', 100, 100))).toEqual([])
  })

  it('zwraca id obiektu, na który nachodzi kandydat', () => {
    const objects = [square('a', 100, 100), square('b', 300, 300)]
    expect(findCollisions(objects, square('new', 110, 110))).toEqual(['a'])
  })

  it('zwraca wszystkie kolidujące obiekty', () => {
    const objects = [square('a', 100, 100), square('b', 120, 100), square('c', 300, 300)]
    expect(findCollisions(objects, square('new', 110, 100))).toEqual(['a', 'b'])
  })

  it('stykanie się krawędziami nie jest kolizją', () => {
    const objects = [square('a', 100, 100)]
    expect(findCollisions(objects, square('new', 120, 100))).toEqual([])
  })

  it('pomija obiekty z ignoreIds (przesuwany obiekt nie koliduje sam ze sobą)', () => {
    const objects = [square('a', 100, 100)]
    expect(findCollisions(objects, square('a', 105, 100), ['a'])).toEqual([])
  })

  it('uwzględnia obrót: AABB się nakładają, ale obrócone kwadraty nie', () => {
    const objects = [square('a', 100, 100, 45)]
    expect(findCollisions(objects, square('new', 120, 120, 45))).toEqual([])
  })

  it('uwzględnia obrót: róg obróconego kwadratu wchodzi w sąsiada', () => {
    const objects = [square('a', 120, 100)]
    expect(findCollisions(objects, square('new', 100, 100, 45))).toEqual(['a'])
  })
})
