import { describe, expect, it } from 'vitest'
import { checkPlacement } from './placement'
import { layer, sceneWith, square } from './test-scene'

// Scena 640 × 480 z jednym kwadratem, któremu nadpisujemy wybrane pola.
const withObject = (changes: object) =>
  sceneWith([layer('grass', [{ ...square('a', 100, 100), ...changes }])])
const codes = (changes: object) => checkPlacement(withObject(changes)).map((i) => i.code)

describe('checkPlacement', () => {
  it('poprawny obiekt: brak problemów', () => {
    expect(codes({})).toEqual([])
  })

  it('granice zakresów są dozwolone', () => {
    expect(codes({ scaleX: 0.1, scaleY: 10, rotation: 360, x: 0, y: 480 })).toEqual([])
  })

  it('skala poza 0,1–10: jeden problem, nawet gdy obie osie są złe', () => {
    expect(codes({ scaleX: 0.05 })).toEqual(['SCALE_OUT_OF_RANGE'])
    expect(codes({ scaleX: 11, scaleY: 0 })).toEqual(['SCALE_OUT_OF_RANGE'])
  })

  it('obrót poza 0–360', () => {
    expect(codes({ rotation: -90 })).toEqual(['ROTATION_OUT_OF_RANGE'])
    expect(codes({ rotation: 450 })).toEqual(['ROTATION_OUT_OF_RANGE'])
  })

  it('środek poza sceną', () => {
    expect(codes({ x: -1 })).toEqual(['OBJECT_OUT_OF_BOUNDS'])
    expect(codes({ y: 481 })).toEqual(['OBJECT_OUT_OF_BOUNDS'])
  })

  it('problem wskazuje warstwę i obiekt', () => {
    expect(checkPlacement(withObject({ rotation: -90 }))).toEqual([
      {
        code: 'ROTATION_OUT_OF_RANGE',
        messageKey: 'errors.rotationOutOfRange',
        layerId: 'grass',
        objectId: 'a',
      },
    ])
  })
})
