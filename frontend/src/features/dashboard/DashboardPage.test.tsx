import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, editor, withSession } from '../../test/handlers'
import DashboardPage from './DashboardPage'

const body = (users: number | null) => ({ totalPages: 3, totalPosts: 7, publishedPosts: 5, draftPosts: 2, mediaFiles: 9, totalUsers: users, recent: [{ id: 1, type: 'post', title: 'Hello', status: 'Published', updatedAt: new Date().toISOString() }] })

describe('DashboardPage', () => {
  it('renders metrics from the API, quick actions and user widgets for admins', async () => {
    server.use(withSession(admin), http.get('*/api/dashboard', () => HttpResponse.json(body(4))))
    renderApp(<DashboardPage />)
    expect(await screen.findByLabelText('Total posts')).toHaveTextContent('7')
    expect(screen.getByLabelText('Draft posts')).toHaveTextContent('2')
    expect(screen.getByLabelText('Total users')).toHaveTextContent('4')
    expect(screen.getByRole('link', { name: 'Manage users' })).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  it('hides admin-only widgets for editors', async () => {
    server.use(withSession(editor), http.get('*/api/dashboard', () => HttpResponse.json(body(null))))
    renderApp(<DashboardPage />)
    await screen.findByLabelText('Total posts')
    expect(screen.queryByLabelText('Total users')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Manage users' })).not.toBeInTheDocument()
  })
  it('shows an empty state when there is no content and an error when the API fails', async () => {
    server.use(withSession(admin), http.get('*/api/dashboard', () => HttpResponse.json({ ...body(1), recent: [] })))
    const { unmount } = renderApp(<DashboardPage />)
    expect(await screen.findByText(/No content yet/)).toBeInTheDocument()
    unmount()
    server.use(http.get('*/api/dashboard', () => HttpResponse.json({ title: 'x', detail: 'Boom' }, { status: 500 })))
    renderApp(<DashboardPage />)
    expect(await screen.findByText('Boom')).toBeInTheDocument()
  })
})
