import { describe, expect, it } from 'vitest'
import { EngineError } from './errors'

describe('EngineError', () => {
  it('przechowuje kod błędu', () => {
    const error = new EngineError('LAYER_LIMIT')
    expect(error.code).toBe('LAYER_LIMIT')
    expect(error instanceof Error).toBe(true)
  })
})
