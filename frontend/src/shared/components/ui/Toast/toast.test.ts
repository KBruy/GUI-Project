import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, getToasts, toast } from './toast'

describe('toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    getToasts().forEach((item) => dismissToast(item.id))
    vi.useRealTimers()
  })

  it('adds toasts in order with their type and key', () => {
    toast.success('project.saved')
    toast.error('errors.network')
    expect(getToasts().map((item) => [item.type, item.messageKey])).toEqual([
      ['success', 'project.saved'],
      ['error', 'errors.network'],
    ])
  })

  it('removes a toast on dismiss', () => {
    const id = toast.info('common.comingSoon')
    dismissToast(id)
    expect(getToasts()).toEqual([])
  })

  it('removes a toast by itself after 4 seconds', () => {
    toast.success('project.saved')
    vi.advanceTimersByTime(3999)
    expect(getToasts()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(getToasts()).toEqual([])
  })
})
