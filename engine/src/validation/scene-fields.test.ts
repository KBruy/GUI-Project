import { describe, expect, it } from 'vitest'
import { checkSceneFields } from './scene-fields'
import { layer, validScene } from './test-scene'

const codes = (scene: typeof validScene) => checkSceneFields(scene).map((i) => i.code)

describe('checkSceneFields', () => {
  it('poprawna scena: brak problemów', () => {
    expect(checkSceneFields(validScene)).toEqual([])
  })

  it('nieobsługiwana wersja schematu', () => {
    expect(codes({ ...validScene, schemaVersion: 2 })).toEqual(['UNSUPPORTED_SCHEMA_VERSION'])
  })

  it('pusta nazwa i nazwa z samych spacji', () => {
    expect(codes({ ...validScene, name: '' })).toEqual(['NAME_REQUIRED'])
    expect(codes({ ...validScene, name: '   ' })).toEqual(['NAME_REQUIRED'])
  })

  it('rozmiar mapy spoza listy', () => {
    expect(codes({ ...validScene, width: 1000, height: 1000 })).toEqual(['INVALID_SCENE_SIZE'])
  })

  it('postać ma tylko rozmiar 256 × 512', () => {
    const character = { ...validScene, type: 'character' as const }
    expect(codes(character)).toEqual(['INVALID_SCENE_SIZE'])
    expect(codes({ ...character, width: 256, height: 512 })).toEqual([])
  })

  it('11 warstw: LAYER_LIMIT', () => {
    const layers = Array.from({ length: 11 }, (_, i) => layer(`l${i}`, []))
    expect(codes({ ...validScene, layers })).toEqual(['LAYER_LIMIT'])
  })

  it('każdy problem ma klucz tłumaczenia jak w backendzie', () => {
    const [problem] = checkSceneFields({ ...validScene, name: '' })
    expect(problem).toEqual({ code: 'NAME_REQUIRED', messageKey: 'errors.nameRequired' })
  })
})
