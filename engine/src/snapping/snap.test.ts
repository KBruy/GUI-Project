import { describe, expect, it } from 'vitest'
import { snapCenter, snapToGrid } from './snap'

describe('snapToGrid', () => {
  it('zaokrągla punkt do najbliższego węzła siatki 32 px', () => {
    expect(snapToGrid({ x: 40, y: 70 })).toEqual({ x: 32, y: 64 })
    expect(snapToGrid({ x: 47, y: 15 })).toEqual({ x: 32, y: 0 })
  })

  it('dokładnie w połowie pola zaokrągla w górę', () => {
    expect(snapToGrid({ x: 48, y: 16 })).toEqual({ x: 64, y: 32 })
  })

  it('punkt na siatce zostaje na miejscu', () => {
    expect(snapToGrid({ x: 64, y: 128 })).toEqual({ x: 64, y: 128 })
  })

  it('przyjmuje inny rozmiar siatki', () => {
    expect(snapToGrid({ x: 20, y: 7 }, 16)).toEqual({ x: 16, y: 0 })
  })
})

describe('snapCenter', () => {
  it('kafelek 32 × 32 wypełnia dokładnie jedno pole', () => {
    // Lewy górny róg (34, 34) trafia na (32, 32), więc środek to (48, 48).
    expect(snapCenter({ x: 50, y: 50 }, 32, 32)).toEqual({ x: 48, y: 48 })
  })

  it('większy obiekt: lewy górny róg na linii siatki', () => {
    // Drzewo 64 × 96: róg (68, 52) trafia na (64, 64).
    const center = snapCenter({ x: 100, y: 100 }, 64, 96)
    expect(center).toEqual({ x: 96, y: 112 })
    expect(center.x - 64 / 2).toBe(64)
    expect(center.y - 96 / 2).toBe(64)
  })

  it('obiekt o rozmiarze innym niż wielokrotność 32: róg na siatce, środek poza nią', () => {
    // Kamień 20 × 20: róg (90, 90) trafia na (96, 96), środek (106, 106).
    expect(snapCenter({ x: 100, y: 100 }, 20, 20)).toEqual({ x: 106, y: 106 })
  })

  it('obiekt już przyciągnięty zostaje na miejscu', () => {
    expect(snapCenter({ x: 48, y: 48 }, 32, 32)).toEqual({ x: 48, y: 48 })
  })
})
