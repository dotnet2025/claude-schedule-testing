import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { server } from '../test/server'
import { renderApp } from '../test/utils'
import { admin, editor, noSession, withSession } from '../test/handlers'
import ProtectedRoute from './ProtectedRoute'

const ui = (
  <Routes>
    <Route path="/login" element={<h1>Login page</h1>} />
    <Route element={<ProtectedRoute roles={['Admin', 'Editor']} />}>
      <Route path="/admin" element={<h1>Dashboard</h1>} />
      <Route element={<ProtectedRoute roles={['Admin']} />}><Route path="/admin/users" element={<h1>Users</h1>} /></Route>
    </Route>
  </Routes>
)

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to login', async () => {
    server.use(noSession)
    renderApp(ui, '/admin')
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
  it('renders for an authenticated editor', async () => {
    server.use(withSession(editor))
    renderApp(ui, '/admin')
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
  it('shows 403 for an editor on an admin-only route', async () => {
    server.use(withSession(editor))
    renderApp(ui, '/admin/users')
    expect(await screen.findByText(/403/)).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
  })
  it('allows admins on admin-only routes', async () => {
    server.use(withSession(admin))
    renderApp(ui, '/admin/users')
    expect(await screen.findByText('Users')).toBeInTheDocument()
  })
})
