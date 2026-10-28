import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, withSession } from '../../test/handlers'
import type { User } from '../../types'
import UsersPage from './UsersPage'
import { validateUser } from './UserFormDialog'

const user = (n: number, over: Partial<User> = {}): User => ({
  id: n + 10, email: `u${n}@x.test`, username: `user${n}`, firstName: 'Una', lastName: `Num${n}`, displayName: `Una Num${n}`, role: 'Editor', isActive: true,
  companyId: null, companyName: null, lastLoginAt: null, ...over,
})
const paged = (items: User[], total = items.length, totalPages = 1) => ({ items, total, page: 1, pageSize: 10, totalPages })
const companies = { items: [{ companyId: 5, companyCode: 'ACME', companyName: 'Acme', isActive: true }], total: 1, page: 1, pageSize: 100, totalPages: 1 }
const base = (items: User[]) => [withSession(admin), http.get('*/api/users', () => HttpResponse.json(paged(items))), http.get('*/api/companies', () => HttpResponse.json(companies))]

describe('UsersPage', () => {
  it('lists users with role and status', async () => {
    server.use(...base([user(1), user(2, { role: 'Admin', isActive: false, companyName: 'Acme' })]))
    renderApp(<UsersPage />)
    expect(await screen.findByText('Una Num1')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('Acme', { selector: 'td' })).toBeInTheDocument()
  })

  it('never renders password hashes even if the API leaked them', async () => {
    server.use(...base([{ ...user(1), passwordHash: 'AQAAAAEAACcQ' } as User]))
    renderApp(<UsersPage />)
    await screen.findByText('Una Num1')
    expect(document.body.textContent).not.toContain('AQAAAA')
  })

  it('sends role/status/company/search/sort/page to the server', async () => {
    const urls: URL[] = []
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(companies)),
      http.get('*/api/users', ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json(paged([user(1)], 30, 3)) }))
    renderApp(<UsersPage />)
    await screen.findByText('Una Num1')
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('page')).toBe('3'))
    await userEvent.click(screen.getByLabelText('Role'))
    await userEvent.click(await screen.findByRole('option', { name: 'Admin' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('role')).toBe('Admin'))
    expect(urls.at(-1)?.searchParams.get('page')).toBe('1')
    await userEvent.click(screen.getByLabelText('Status'))
    await userEvent.click(await screen.findByRole('option', { name: 'Active' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('isActive')).toBe('true'))
    await userEvent.type(screen.getByLabelText('Search users'), 'una')
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('search')).toBe('una'))
    await userEvent.click(screen.getByLabelText('Company'))
    await userEvent.click(await screen.findByRole('option', { name: 'Acme' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('companyId')).toBe('5'))
  })

  it('creates a user with first/last name, username, company and role', async () => {
    let body: Record<string, unknown> = {}
    server.use(...base([]), http.post('*/api/users', async ({ request }) => { body = (await request.json()) as Record<string, unknown>; return HttpResponse.json(user(1), { status: 201 }) }))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add user' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.type(within(dlg).getByLabelText(/^First name/), 'Jane')
    await userEvent.type(within(dlg).getByLabelText(/^Last name/), 'Doe')
    await userEvent.type(within(dlg).getByLabelText(/^Username/), 'jane.doe')
    await userEvent.type(within(dlg).getByLabelText(/^Email/), 'jane@x.test')
    await userEvent.type(within(dlg).getByLabelText(/^Password/), 'Passw0rd!')
    await userEvent.click(within(dlg).getByLabelText('Company'))
    await userEvent.click(await screen.findByRole('option', { name: 'Acme' }))
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('User saved')).toBeInTheDocument()
    expect(body).toMatchObject({ firstName: 'Jane', lastName: 'Doe', username: 'jane.doe', email: 'jane@x.test', password: 'Passw0rd!', role: 'Editor', companyId: 5 })
  })

  it('blocks submission on invalid input and shows server conflict messages', async () => {
    let posts = 0
    server.use(...base([]), http.post('*/api/users', () => { posts++; return HttpResponse.json({ title: 'Conflict', detail: 'A user with this email already exists.' }, { status: 409 }) }))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add user' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await within(dlg).findByText('First name is required')).toBeInTheDocument()
    expect(within(dlg).getByText('Username is required')).toBeInTheDocument()
    expect(posts).toBe(0)
    await userEvent.type(within(dlg).getByLabelText(/^First name/), 'A')
    await userEvent.type(within(dlg).getByLabelText(/^Last name/), 'B')
    await userEvent.type(within(dlg).getByLabelText(/^Username/), 'abc')
    await userEvent.type(within(dlg).getByLabelText(/^Email/), 'a@b.co')
    await userEvent.type(within(dlg).getByLabelText(/^Password/), 'Passw0rd!')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await within(dlg).findByText('A user with this email already exists.')).toBeInTheDocument()
  })

  it('edit sends PUT for the profile and PATCH role when the role changed', async () => {
    let put: Record<string, unknown> | null = null
    let role: unknown = null
    server.use(...base([user(1)]),
      http.put('*/api/users/11', async ({ request }) => { put = (await request.json()) as Record<string, unknown>; return HttpResponse.json(user(1)) }),
      http.patch('*/api/users/11/role', async ({ request }) => { role = await request.json(); return HttpResponse.json(user(1, { role: 'Admin' })) }))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit u1@x.test' }))
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByLabelText(/^Username/)).toHaveValue('user1')
    expect(within(dlg).queryByLabelText(/^Password/)).not.toBeInTheDocument()
    await userEvent.click(within(dlg).getByLabelText('Role'))
    await userEvent.click(await screen.findByRole('option', { name: 'Admin' }))
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('User saved')).toBeInTheDocument()
    expect(put).toMatchObject({ firstName: 'Una', username: 'user1' })
    expect(put).not.toHaveProperty('role')
    expect(role).toEqual({ role: 'Admin' })
  })

  it('view mode is read-only', async () => {
    server.use(...base([user(1, { lastLoginAt: '2026-02-01T10:00:00Z' })]))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'View u1@x.test' }))
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByLabelText(/^Email/)).toBeDisabled()
    expect(within(dlg).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(within(dlg).getByText(/Last login:/)).toBeInTheDocument()
  })

  it('toggles status via PATCH and disables the switch for the signed-in admin', async () => {
    let patch: unknown = null
    server.use(...base([user(1), { ...user(0), id: admin.id, email: 'admin@example.com' }]),
      http.patch('*/api/users/11/status', async ({ request }) => { patch = await request.json(); return HttpResponse.json(user(1, { isActive: false })) }))
    renderApp(<UsersPage />)
    await screen.findByText('u1@x.test')
    expect(await screen.findByLabelText('Deactivate admin@example.com')).toBeDisabled()
    await userEvent.click(screen.getByLabelText('Deactivate u1@x.test'))
    expect(await screen.findByText('User deactivated')).toBeInTheDocument()
    expect(patch).toEqual({ isActive: false })
  })

  it('shows the last-admin protection message when a change is refused', async () => {
    server.use(...base([user(1, { role: 'Admin' })]),
      http.patch('*/api/users/11/status', () => HttpResponse.json({ title: 'Conflict', detail: 'The last active Admin cannot be demoted, deactivated or deleted.' }, { status: 409 })))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByLabelText('Deactivate u1@x.test'))
    expect(await screen.findByText(/last active Admin/)).toBeInTheDocument()
  })

  it('reset password dialog validates, requires a matching confirmation and posts only to the reset endpoint', async () => {
    let body: unknown = null
    server.use(...base([user(1)]), http.post('*/api/users/11/reset-password', async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 204 }) }))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Reset password u1@x.test' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.type(within(dlg).getByLabelText('New password'), 'short')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Reset password' }))
    expect(await within(dlg).findByText(/at least 8 characters/)).toBeInTheDocument()
    expect(body).toBeNull()
    await userEvent.clear(within(dlg).getByLabelText('New password'))
    await userEvent.type(within(dlg).getByLabelText('New password'), 'NewPassw0rd!')
    await userEvent.type(within(dlg).getByLabelText('Confirm new password'), 'Different1!')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Reset password' }))
    expect(await within(dlg).findByText('Passwords do not match.')).toBeInTheDocument()
    await userEvent.clear(within(dlg).getByLabelText('Confirm new password'))
    await userEvent.type(within(dlg).getByLabelText('Confirm new password'), 'NewPassw0rd!')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Reset password' }))
    expect(await screen.findByText('Password reset')).toBeInTheDocument()
    expect(body).toEqual({ newPassword: 'NewPassw0rd!' })
  })

  it('delete confirmation and 409 guidance for referenced users', async () => {
    server.use(...base([user(1)]), http.delete('*/api/users/11', () => HttpResponse.json({ title: 'Conflict', detail: 'This user is referenced. Deactivate the user instead.' }, { status: 409 })))
    renderApp(<UsersPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete u1@x.test' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(/Deactivate the user instead/)).toBeInTheDocument()
  })
})

describe('validateUser', () => {
  const ok = { firstName: 'A', lastName: 'B', username: 'abc', email: 'a@b.co', phone: '', companyId: '', role: 'Editor' as const, password: 'Passw0rd!' }
  it('accepts valid input', () => expect(validateUser(ok, true)).toEqual({}))
  it('does not require a password when editing', () => expect(validateUser({ ...ok, password: '' }, false)).toEqual({}))
  it('rejects bad usernames, emails and weak passwords', () => {
    expect(validateUser({ ...ok, username: 'ab' }, true).username).toBeDefined()
    expect(validateUser({ ...ok, username: 'a b!' }, true).username).toBeDefined()
    expect(validateUser({ ...ok, email: 'nope' }, true).email).toBeDefined()
    expect(validateUser({ ...ok, password: 'abcdefgh' }, true).password).toBeDefined()
    expect(validateUser({ ...ok, password: '1234567' }, true).password).toBeDefined()
    expect(validateUser({ ...ok, phone: '1'.repeat(26) }, true).phone).toBeDefined()
  })
})
