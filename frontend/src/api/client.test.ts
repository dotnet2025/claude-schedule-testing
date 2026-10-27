import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { api, ApiError, qs, setAccessToken } from './client'

describe('api client', () => {
  afterEach(() => setAccessToken(null))
  it('sends the bearer token and parses JSON', async () => {
    setAccessToken('abc')
    server.use(http.get('*/api/x', ({ request }) => HttpResponse.json({ auth: request.headers.get('authorization') })))
    expect(await api<{ auth: string }>('/api/x')).toEqual({ auth: 'Bearer abc' })
  })
  it('refreshes once on 401 and retries', async () => {
    setAccessToken('old'); let calls = 0
    server.use(
      http.get('*/api/y', ({ request }) => { calls++; return request.headers.get('authorization') === 'Bearer new' ? HttpResponse.json({ ok: true }) : new HttpResponse(null, { status: 401 }) }),
      http.post('*/api/auth/refresh', () => HttpResponse.json({ accessToken: 'new', expiresAt: '', refreshToken: 'r', user: {} })),
    )
    expect(await api('/api/y')).toEqual({ ok: true })
    expect(calls).toBe(2)
  })
  it('throws ApiError with problem details and validation messages', async () => {
    server.use(http.post('*/api/z', () => HttpResponse.json({ title: 'Validation failed', errors: { Title: ['Title is required'] } }, { status: 400 })))
    await expect(api('/api/z', { method: 'POST', json: {} })).rejects.toMatchObject({ status: 400, message: 'Title is required' })
  })
  it('maps network failures to a friendly error', async () => {
    server.use(http.get('*/api/net', () => HttpResponse.error()))
    await expect(api('/api/net')).rejects.toBeInstanceOf(ApiError)
  })
  it('builds query strings skipping empty values', () => {
    expect(qs({ a: 1, b: '', c: undefined, d: 'x y' })).toBe('?a=1&d=x+y')
    expect(qs({})).toBe('')
  })
})
