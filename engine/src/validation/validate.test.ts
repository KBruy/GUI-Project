import { describe, expect, it } from 'vitest'
import { layer, sceneWith, square, validScene } from './test-scene'
import { validateScene } from './validate'

describe('validateScene', () => {
  it('poprawna scena: pusta lista', () => {
    expect(validateScene(validScene)).toEqual([])
  })

  it('zbiera problemy ze wszystkich reguł naraz', () => {
    // Drugi obiekt ma to samo id co pierwszy, zły obrót i nachodzi na pierwszy.
    const duplicate = { ...square('a', 110, 100), rotation: -90 }
    const scene = sceneWith([layer('grass', [square('a', 100, 100), duplicate])])
    const broken = { ...scene, name: '' }
    expect(validateScene(broken).map((i) => i.code)).toEqual([
      'NAME_REQUIRED',
      'DUPLICATE_ID',
      'ROTATION_OUT_OF_RANGE',
      'COLLISION',
    ])
  })
})
