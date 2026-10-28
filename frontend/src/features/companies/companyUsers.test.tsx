import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, withSession } from '../../test/handlers'
import type { Company, CompanyUser } from '../../types'
import CompanyUserList from './CompanyUserList'
import CompanyUsersTab from './CompanyUsersTab'

const co: Company = { companyId: 7, companyCode: 'ACME', companyName: 'Acme Corp', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', activeUserCount: 1 }
const row = (o: Partial<CompanyUser> = {}): CompanyUser => ({
  companyUserId: 1, companyId: 7, companyCode: 'ACME', companyName: 'Acme Corp', companyIsActive: true, userId: 5, userName: 'Jane Doe', username: 'jane',
  email: 'jane@x.io', phone: null, systemRole: 'Editor', userIsActive: true, isActive: true, isPrimaryCompany: true, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z', ...o,
})
const page = (items: CompanyUser[], extra = {}) => ({ items, total: items.length, page: 1, pageSize: 10, totalPages: 1, ...extra })

describe('CompanyUserList', () => {
  it('renders assignments from the API with role, status and primary indicator', async () => {
    server.use(withSession(admin), http.get('*/api/company-users', () => HttpResponse.json(page([row(), row({ companyUserId: 2, userName: 'Bob', email: 'bob@x.io', isPrimaryCompany: false, isActive: false })]))))
    renderApp(<CompanyUserList />)
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@x.io')).toBeInTheDocument()
    expect(screen.getAllByText('Editor').length).toBeGreaterThan(0)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Primary company')).toHaveLength(1)
  })

  it('sends search, filters and sorting to the server and shows the empty state', async () => {
    const urls: URL[] = []
    server.use(withSession(admin), http.get('*/api/company-users', ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json(page([])) }))
    renderApp(<CompanyUserList />)
    expect(await screen.findByText('No assignments match your filters.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search company or user'), 'jane')
    await waitFor(() => expect(urls.some((u) => u.searchParams.get('search') === 'jane')).toBe(true))
    await userEvent.click(screen.getByLabelText('Assignment status'))
    await userEvent.click(await screen.findByRole('option', { name: 'Inactive' }))
    await waitFor(() => expect(urls.some((u) => u.searchParams.get('assignmentIsActive') === 'false')).toBe(true))
  })

  it('requests the next page from the server when paginating', async () => {
    const pages: string[] = []
    server.use(withSession(admin), http.get('*/api/company-users', ({ request }) => {
      const p = new URL(request.url).searchParams.get('page') ?? '1'; pages.push(p)
      return HttpResponse.json(page([row({ companyUserId: Number(p) })], { page: Number(p), total: 20, totalPages: 2 }))
    }))
    renderApp(<CompanyUserList />)
    await screen.findByText('Jane Doe')
    await userEvent.click(screen.getByRole('button', { name: /go to page 2/i }))
    await waitFor(() => expect(pages).toContain('2'))
  })

  it('shows an error when the API fails', async () => {
    server.use(withSession(admin), http.get('*/api/company-users', () => HttpResponse.json({ title: 'Boom', detail: 'Server exploded' }, { status: 500 })))
    renderApp(<CompanyUserList />)
    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
  })

  it('confirms before removing, calls DELETE and refreshes the list', async () => {
    let items = [row()]; let deleted = false
    server.use(withSession(admin),
      http.get('*/api/company-users', () => HttpResponse.json(page(items))),
      http.delete('*/api/company-users/1', () => { deleted = true; items = [row({ isActive: false, isPrimaryCompany: false })]; return new HttpResponse(null, { status: 204 }) }))
    renderApp(<CompanyUserList />)
    await userEvent.click(await screen.findByLabelText('Remove jane@x.io from ACME'))
    expect(deleted).toBe(false) // nothing happens until confirmed
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByText(/user and the company are kept/i)).toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(deleted).toBe(true))
    expect(await screen.findByText('Assignment removed')).toBeInTheDocument()
    expect(await screen.findByText('Inactive')).toBeInTheDocument() // list refreshed
  })

  it('edits only status/primary and refreshes', async () => {
    let body: unknown
    server.use(withSession(admin),
      http.get('*/api/company-users', () => HttpResponse.json(page([row({ isPrimaryCompany: false })]))),
      http.put('*/api/company-users/1', async ({ request }) => { body = await request.json(); return HttpResponse.json(row()) }))
    renderApp(<CompanyUserList />)
    await userEvent.click(await screen.findByLabelText('Edit jane@x.io in ACME'))
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).queryByRole('combobox')).not.toBeInTheDocument() // company/user are read-only text
    await userEvent.click(within(dlg).getByLabelText('Primary company'))
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(body).toEqual({ isActive: true, isPrimaryCompany: true }))
  })
})

describe('CompanyUsersTab', () => {
  it('shows a helpful empty state and assigns an existing user with the company preselected', async () => {
    let assigned: unknown
    server.use(withSession(admin),
      http.get('*/api/company-users', () => HttpResponse.json(page([]))),
      http.get('*/api/users', () => HttpResponse.json({ items: [{ id: 5, email: 'jane@x.io', displayName: 'Jane Doe', role: 'Editor', isActive: true }], total: 1, page: 1, pageSize: 20, totalPages: 1 })),
      http.post('*/api/company-users', async ({ request }) => { assigned = await request.json(); return HttpResponse.json(row(), { status: 201 }) }))
    renderApp(<CompanyUsersTab company={co} />)
    expect(await screen.findByText(/No users are assigned to this company yet/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add existing user' }))
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByLabelText('Company')).toBeDisabled()
    expect(within(dlg).getByLabelText('Company')).toHaveValue('Acme Corp (ACME)')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Assign user' }))
    expect(await within(dlg).findByText('Select a user')).toBeInTheDocument() // validation message
    await userEvent.click(within(dlg).getByLabelText(/User/))
    await userEvent.click(await screen.findByRole('option', { name: /Jane Doe/ }))
    await userEvent.click(within(dlg).getByRole('button', { name: 'Assign user' }))
    await waitFor(() => expect(assigned).toEqual({ companyId: 7, userId: 5, isActive: true, isPrimaryCompany: false }))
    expect(await screen.findByText('User assigned')).toBeInTheDocument()
  })

  it('shows the server message (409) when assignment fails', async () => {
    server.use(withSession(admin),
      http.get('*/api/company-users', () => HttpResponse.json(page([]))),
      http.get('*/api/users', () => HttpResponse.json({ items: [{ id: 5, email: 'jane@x.io', displayName: 'Jane Doe', role: 'Editor', isActive: true }], total: 1, page: 1, pageSize: 20, totalPages: 1 })),
      http.post('*/api/company-users', () => HttpResponse.json({ title: 'Conflict', detail: 'This user is already assigned to this company.' }, { status: 409 })))
    renderApp(<CompanyUsersTab company={co} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add existing user' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.click(within(dlg).getByLabelText(/User/))
    await userEvent.click(await screen.findByRole('option', { name: /Jane Doe/ }))
    await userEvent.click(within(dlg).getByRole('button', { name: 'Assign user' }))
    expect(await within(dlg).findByText('This user is already assigned to this company.')).toBeInTheDocument()
  })

  it('validates and creates a new user for the company, then refreshes', async () => {
    let created: Record<string, unknown> | undefined
    server.use(withSession(admin),
      http.get('*/api/company-users', () => HttpResponse.json(page([]))),
      http.post('*/api/companies/7/users', async ({ request }) => { created = (await request.json()) as Record<string, unknown>; return HttpResponse.json({ user: { id: 9 }, assignment: row() }, { status: 201 }) }))
    renderApp(<CompanyUsersTab company={co} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Create new user' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Create user' }))
    expect(await within(dlg).findByText('First name is required')).toBeInTheDocument()
    expect(within(dlg).getByText('Enter a valid email address')).toBeInTheDocument()
    expect(within(dlg).getByText(/Password must be at least 8/)).toBeInTheDocument()
    expect(created).toBeUndefined()
    await userEvent.type(within(dlg).getByLabelText(/First name/), 'Ann')
    await userEvent.type(within(dlg).getByLabelText(/Last name/), 'Lee')
    await userEvent.type(within(dlg).getByLabelText(/Username/), 'annlee')
    await userEvent.type(within(dlg).getByLabelText(/Email/), 'ann@x.io')
    await userEvent.type(within(dlg).getByLabelText(/Initial password/), 'Passw0rd!')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Create user' }))
    await waitFor(() => expect(created).toMatchObject({ firstName: 'Ann', lastName: 'Lee', username: 'annlee', email: 'ann@x.io', role: 'Editor', isActive: true, isPrimaryCompany: false }))
    expect(await screen.findByText('User created and assigned')).toBeInTheDocument()
  })
})
