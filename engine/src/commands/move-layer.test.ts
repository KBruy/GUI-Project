import { describe, expect, it } from 'vitest'
import { moveLayer } from './move-layer'
import { errorCode, layer, sceneWith } from './test-scene'
import type { Layer } from '../types'

const scene = sceneWith([layer('grass', []), layer('trees', []), layer('rocks', [])])
const order = (s: typeof scene) => s.layers.map((l) => l.id)

// Postać: ciało zablokowane na dole, nad nim spodnie i koszulka.
const characterWith = (layers: Layer[]) => ({ ...sceneWith(layers), type: 'character' as const })
const character = characterWith([layer('body', [], true), layer('pants', []), layer('shirt', [])])

describe('moveLayer', () => {
  it('przenosi warstwę wyżej', () => {
    const result = moveLayer('grass', 2).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['trees', 'rocks', 'grass'])
  })

  it('przenosi warstwę niżej', () => {
    const result = moveLayer('rocks', 0).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['rocks', 'grass', 'trees'])
  })

  it('pozycja spoza listy jest przycinana', () => {
    const result = moveLayer('grass', 99).apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['trees', 'rocks', 'grass'])
  })

  it('undo przywraca poprzednią kolejność', () => {
    const command = moveLayer('grass', 2)
    const result = command.apply(scene)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(command.undo(result.scene)).toEqual(scene)
  })

  it('nieznana warstwa: LAYER_NOT_FOUND', () => {
    expect(errorCode(() => moveLayer('missing', 0).apply(scene))).toBe('LAYER_NOT_FOUND')
  })

  it('zablokowanej warstwy nie można przenieść: LAYER_LOCKED', () => {
    expect(errorCode(() => moveLayer('body', 2).apply(character))).toBe('LAYER_LOCKED')
  })

  it('mapa: inne warstwy mogą mijać zablokowaną (edytor map)', () => {
    const map = sceneWith([layer('grass', []), layer('trees', [], true), layer('rocks', [])])
    const result = moveLayer('rocks', 0).apply(map)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['rocks', 'grass', 'trees'])
  })

  it('nie można przenieść warstwy pod zablokowane ciało', () => {
    expect(errorCode(() => moveLayer('pants', 0).apply(character))).toBe('LAYER_LOCKED')
  })

  it('postać: inne warstwy mogą mijać zablokowaną (edytor map)', () => {
    const result = moveLayer('shirt', 1).apply(character)
    if (!result.ok) throw new Error('oczekiwano ok')
    expect(order(result.scene)).toEqual(['body', 'shirt', 'pants'])
  })
})
