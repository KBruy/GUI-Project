import { describe, expect, it } from 'vitest'
import { newId } from './ids'

describe('newId', () => {
  it('zaczyna się od podanego przedrostka', () => {
    expect(newId('layer').startsWith('layer_')).toBe(true)
  })

  it('kolejne id są różne', () => {
    expect(newId('obj') === newId('obj')).toBe(false)
  })
})
