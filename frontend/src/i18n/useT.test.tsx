import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/AppProviders'
import { useT } from './language'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('useT', () => {
  it('returns Polish text by default', () => {
    const { result } = renderHook(() => useT(), { wrapper: AppProviders })
    expect(result.current.t('nav.editor')).toBe('Edytor map')
  })

  it('returns English text after setLanguage("en")', () => {
    const { result } = renderHook(() => useT(), { wrapper: AppProviders })
    act(() => result.current.setLanguage('en'))
    expect(result.current.t('nav.editor')).toBe('Map Editor')
  })

  it('rejects unknown keys (type error + runtime throw)', () => {
    const { result } = renderHook(() => useT(), { wrapper: AppProviders })
    expect(() => {
      // @ts-expect-error — nieznany klucz to błąd TypeScript i wyjątek w runtime
      result.current.t('bad.key')
    }).toThrow()
  })
})
