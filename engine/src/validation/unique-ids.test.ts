import { describe, expect, it } from 'vitest'
import { layer, sceneWith, square, validScene } from './test-scene'
import { checkUniqueIds } from './unique-ids'

describe('checkUniqueIds', () => {
  it('unikalne id: brak problemów', () => {
    expect(checkUniqueIds(validScene)).toEqual([])
  })

  it('to samo id obiektu na dwóch warstwach: zgłasza drugie wystąpienie', () => {
    const scene = sceneWith([
      layer('grass', [square('a', 100, 100)]),
      layer('trees', [square('a', 300, 300)]),
    ])
    expect(checkUniqueIds(scene)).toEqual([
      { code: 'DUPLICATE_ID', messageKey: 'errors.duplicateId', layerId: 'trees', objectId: 'a' },
    ])
  })

  it('warstwy i obiekty mają wspólną pulę id', () => {
    const scene = sceneWith([layer('x', [square('x', 100, 100)])])
    expect(checkUniqueIds(scene).map((i) => i.objectId)).toEqual(['x'])
  })

  it('powtórzone id warstwy', () => {
    const scene = sceneWith([layer('grass', []), layer('grass', [])])
    expect(checkUniqueIds(scene)).toEqual([
      { code: 'DUPLICATE_ID', messageKey: 'errors.duplicateId', layerId: 'grass' },
    ])
  })
})
