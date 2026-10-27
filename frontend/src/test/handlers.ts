import { http, HttpResponse } from 'msw'
import type { User } from '../types'

export const admin: User = { id: 1, email: 'admin@example.com', displayName: 'Admin', role: 'Admin', isActive: true }
export const editor: User = { id: 2, email: 'ed@example.com', displayName: 'Ed', role: 'Editor', isActive: true }
export const authBody = (user: User) => ({ accessToken: 'tok', expiresAt: new Date(Date.now() + 9e5).toISOString(), refreshToken: 'r', user })
export const noSession = http.post('*/api/auth/refresh', () => HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }))
export const withSession = (user: User) => http.post('*/api/auth/refresh', () => HttpResponse.json(authBody(user)))
