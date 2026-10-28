import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, authBody, noSession } from '../../test/handlers'
import LoginPage from './LoginPage'

const ui = <Routes><Route path="/login" element={<LoginPage />} /><Route path="/admin" element={<h1>Admin home</h1>} /></Routes>

describe('LoginPage', () => {
  it('shows validation errors for empty input without calling the API', async () => {
    let called = false
    server.use(noSession, http.post('*/api/auth/login', () => { called = true; return HttpResponse.json(authBody(admin)) }))
    renderApp(ui, '/login')
    await userEvent.click(await screen.findByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Email or username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('signs in and navigates to the admin area', async () => {
    server.use(noSession, http.post('*/api/auth/login', async ({ request }) => {
      const b = (await request.json()) as { email: string; password: string }
      expect(b).toEqual({ email: 'admin@example.com', password: 'secret123' })
      return HttpResponse.json(authBody(admin))
    }))
    renderApp(ui, '/login')
    await userEvent.type(await screen.findByLabelText(/email/i), 'admin@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Admin home')).toBeInTheDocument()
  })

  it('accepts a username in place of an email', async () => {
    let body: { email: string } | null = null
    server.use(noSession, http.post('*/api/auth/login', async ({ request }) => { body = (await request.json()) as { email: string }; return HttpResponse.json(authBody(admin)) }))
    renderApp(ui, '/login')
    await userEvent.type(await screen.findByLabelText(/email or username/i), 'admin.user')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Admin home')).toBeInTheDocument()
    expect(body).toEqual({ email: 'admin.user', password: 'secret123' })
  })

  it('shows the server error for invalid credentials and stays on the page', async () => {
    server.use(noSession, http.post('*/api/auth/login', () => HttpResponse.json({ title: 'Unauthorized', detail: 'Invalid email or password.' }, { status: 401 })))
    renderApp(ui, '/login')
    await userEvent.type(await screen.findByLabelText(/email/i), 'a@b.co')
    await userEvent.type(screen.getByLabelText(/password/i), 'bad')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Admin home')).not.toBeInTheDocument())
  })
})
