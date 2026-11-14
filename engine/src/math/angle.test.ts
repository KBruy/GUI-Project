import { describe, expect, it } from 'vitest'
import { degToRad, radToDeg } from './angle'

describe('angle', () => {
  it('zamienia stopnie na radiany', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI)
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2)
    expect(degToRad(0)).toBe(0)
  })

  it('zamienia radiany na stopnie', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180)
  })

  it('zamiana w obie strony daje to samo', () => {
    expect(radToDeg(degToRad(37))).toBeCloseTo(37)
  })
})
