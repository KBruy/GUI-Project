import { describe, expect, it } from 'vitest'
import { layer, sceneWith, square } from '../commands/test-scene'
import { objectsInRect } from './objects-in-rect'

// Kwadraty 20 × 20: a zajmuje 90–110, b zajmuje 190–210 (w poziomie).
const a = square('a', 100, 100)
const b = square('b', 200, 100)

describe('objectsInRect', () => {
  it('zwraca obiekty, na które nachodzi ramka', () => {
    const scene = sceneWith([layer('l1', [a, b])])
    expect(objectsInRect(scene, { x: 80, y: 80, width: 40, height: 40 })).toEqual(['a'])
    expect(objectsInRect(scene, { x: 100, y: 90, width: 100, height: 10 })).toEqual(['a', 'b'])
  })

  it('ramka stykająca się z obiektem krawędzią go nie zaznacza', () => {
    const scene = sceneWith([layer('l1', [a])])
    expect(objectsInRect(scene, { x: 110, y: 90, width: 20, height: 20 })).toEqual([])
  })

  it('kliknięcie (ramka 0 × 0) zaznacza obiekt pod kursorem', () => {
    const scene = sceneWith([layer('l1', [a, b])])
    expect(objectsInRect(scene, { x: 105, y: 95, width: 0, height: 0 })).toEqual(['a'])
    expect(objectsInRect(scene, { x: 150, y: 100, width: 0, height: 0 })).toEqual([])
  })

  it('kliknięcie w róg prostokąta otaczającego obróconego obiektu go nie zaznacza', () => {
    // Kwadrat obrócony o 45° to romb. Punkt (92, 92) jest w jego AABB, ale poza rombem.
    const diamond = { ...a, rotation: 45 }
    const scene = sceneWith([layer('l1', [diamond])])
    expect(objectsInRect(scene, { x: 92, y: 92, width: 0, height: 0 })).toEqual([])
    expect(objectsInRect(scene, { x: 100, y: 100, width: 0, height: 0 })).toEqual(['a'])
  })

  it('zwraca obiekty od najniższej warstwy do najwyższej', () => {
    const scene = sceneWith([layer('dol', [a]), layer('gora', [square('c', 100, 100)])])
    expect(objectsInRect(scene, { x: 100, y: 100, width: 0, height: 0 })).toEqual(['a', 'c'])
  })

  it('pomija ukryte i zablokowane warstwy', () => {
    const hidden = { ...layer('ukryta', [a]), visible: false }
    const locked = layer('zablokowana', [b], true)
    const scene = sceneWith([hidden, locked])
    expect(objectsInRect(scene, { x: 0, y: 0, width: 640, height: 480 })).toEqual([])
  })
  it('ramka w kształcie linii nie zaznacza obróconego obiektu obok niej', () => {
    // Romb (kwadrat obrócony o 45°) sięga w poziomie od ok. 85,9 do 114,1.
    const scene = sceneWith([layer('l1', [{ ...a, rotation: 45 }])])
    expect(objectsInRect(scene, { x: 115, y: 90, width: 0, height: 20 })).toEqual([])
    expect(objectsInRect(scene, { x: 90, y: 115, width: 20, height: 0 })).toEqual([])
    expect(objectsInRect(scene, { x: 100, y: 90, width: 0, height: 20 })).toEqual(['a'])
  })

})
