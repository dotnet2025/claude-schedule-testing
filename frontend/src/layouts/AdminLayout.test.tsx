import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { server } from '../test/server'
import { renderApp } from '../test/utils'
import { admin, editor, withSession } from '../test/handlers'
import AdminLayout from './AdminLayout'

const ui = <Routes><Route path="/admin" element={<AdminLayout />}><Route index element={<h1>Home</h1>} /></Route></Routes>

describe('AdminLayout navigation', () => {
  it('shows the Masters group with Company Master and User Master to admins', async () => {
    server.use(withSession(admin), http.get('*/api/dashboard', () => HttpResponse.json({})))
    renderApp(ui, '/admin')
    expect((await screen.findAllByRole('link', { name: 'Company Master' }))[0]).toHaveAttribute('href', '/admin/masters/companies')
    expect(screen.getAllByRole('link', { name: 'User Master' })[0]).toHaveAttribute('href', '/admin/masters/users')
  })
  it('hides Masters from editors', async () => {
    server.use(withSession(editor))
    renderApp(ui, '/admin')
    await screen.findAllByRole('link', { name: 'Pages' })
    expect(screen.queryByRole('link', { name: 'Company Master' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'User Master' })).not.toBeInTheDocument()
    expect(screen.queryByText('Masters')).not.toBeInTheDocument()
  })
})
