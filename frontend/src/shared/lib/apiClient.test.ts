import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '@/config/env'
import { ApiError, api } from './apiClient'

function mockFetch(response: Response | Error) {
  const fn = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api', () => {
  it('get zwraca JSON z odpowiedzi', async () => {
    const fetch = mockFetch(json(200, { ok: true }))
    await expect(api.get('/api/health')).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith(API_URL + '/api/health', { method: 'GET' })
  })

  it('post wysyła JSON z nagłówkiem Content-Type', async () => {
    const fetch = mockFetch(json(201, { id: 'p1' }))
    await api.post('/api/projects', { name: 'Mapa' })
    expect(fetch).toHaveBeenCalledWith(API_URL + '/api/projects', {
      method: 'POST',
      body: '{"name":"Mapa"}',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('FormData idzie bez Content-Type', async () => {
    const fetch = mockFetch(json(201, { id: 'p1' }))
    const form = new FormData()
    await api.post('/api/projects/import', form)
    expect(fetch).toHaveBeenCalledWith(API_URL + '/api/projects/import', {
      method: 'POST',
      body: form,
    })
  })

  it('del przy 204 zwraca undefined', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(api.del('/api/projects/p1')).resolves.toBeUndefined()
  })

  it('błąd 400 zwraca code i messageKey z backendu', async () => {
    mockFetch(
      json(400, { error: { code: 'INVALID_FILE', messageKey: 'errors.invalidFile', details: {} } })
    )
    const err = await api.post('/api/projects/import', new FormData()).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 400,
      code: 'INVALID_FILE',
      messageKey: 'errors.invalidFile',
    })
  })

  it('nieznany messageKey zamienia na errors.serverError', async () => {
    mockFetch(json(422, { error: { code: 'NEW_CODE', messageKey: 'errors.somethingNew' } }))
    const err = await api.get('/api/x').catch((e) => e)
    expect(err).toMatchObject({ code: 'NEW_CODE', messageKey: 'errors.serverError' })
  })

  it('odpowiedź bez JSON-a daje errors.serverError', async () => {
    mockFetch(new Response('Bad Gateway', { status: 502 }))
    const err = await api.get('/api/x').catch((e) => e)
    expect(err).toMatchObject({ status: 502, messageKey: 'errors.serverError' })
  })

  it('brak połączenia daje errors.network', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    const err = await api.get('/api/health').catch((e) => e)
    expect(err).toMatchObject({ status: 0, code: 'NETWORK', messageKey: 'errors.network' })
  })
})
