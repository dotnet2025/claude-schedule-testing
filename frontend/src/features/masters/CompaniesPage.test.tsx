import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, withSession } from '../../test/handlers'
import type { Company } from '../../types'
import CompaniesPage from './CompaniesPage'
import { validateCompany } from './CompanyFormDialog'

const company = (n: number, over: Partial<Company> = {}): Company => ({
  companyId: n, companyCode: `C${n}`, companyName: `Company ${n}`, email: `c${n}@x.test`, phone: null, website: null, isActive: true,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', userCount: 0, city: 'Paris', country: 'FR', ...over,
})
const paged = (items: Company[], total = items.length, page = 1, totalPages = 1) => ({ items, total, page, pageSize: 10, totalPages })

describe('CompaniesPage', () => {
  it('lists companies with status chips and counts', async () => {
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([company(1), company(2, { isActive: false, userCount: 3 })]))))
    renderApp(<CompaniesPage />)
    expect(await screen.findByText('Company 1')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('2 companies')).toBeInTheDocument()
  })

  it('shows empty and error states', async () => {
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([]))))
    const { unmount } = renderApp(<CompaniesPage />)
    expect(await screen.findByText('No companies found.')).toBeInTheDocument()
    unmount()
    server.use(http.get('*/api/companies', () => HttpResponse.json({ title: 'x', detail: 'Boom' }, { status: 500 })))
    renderApp(<CompaniesPage />)
    expect(await screen.findByText('Boom')).toBeInTheDocument()
  })

  it('sends search, status filter and sort params to the server and resets to page 1', async () => {
    const urls: URL[] = []
    server.use(withSession(admin), http.get('*/api/companies', ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json(paged([company(1)], 25, 1, 3)) }))
    renderApp(<CompaniesPage />)
    await screen.findByText('Company 1')
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('page')).toBe('2'))
    await userEvent.type(screen.getByLabelText('Search companies'), 'acme')
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('search')).toBe('acme'))
    expect(urls.at(-1)?.searchParams.get('page')).toBe('1')
    await userEvent.click(screen.getByLabelText('Status'))
    await userEvent.click(await screen.findByRole('option', { name: 'Inactive' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('isActive')).toBe('false'))
    await userEvent.click(screen.getByLabelText('Sort by'))
    await userEvent.click(await screen.findByRole('option', { name: 'Name' }))
    await waitFor(() => expect(urls.at(-1)?.searchParams.get('sortBy')).toBe('name'))
  })

  it('validates required fields on the client and does not call the API', async () => {
    let posted = false
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([]))), http.post('*/api/companies', () => { posted = true; return HttpResponse.json(company(9)) }))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add company' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await within(dlg).findByText('Company code is required')).toBeInTheDocument()
    expect(within(dlg).getByText('Company name is required')).toBeInTheDocument()
    await userEvent.type(within(dlg).getByLabelText(/^Company code/), 'X1')
    await userEvent.type(within(dlg).getByLabelText(/^Company name/), 'X One')
    await userEvent.type(within(dlg).getByLabelText('Website'), 'ftp://nope')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await within(dlg).findByText('Enter a valid http(s) URL')).toBeInTheDocument()
    expect(posted).toBe(false)
  })

  it('creates a company and shows server-side duplicate-code errors', async () => {
    let calls = 0
    let body: Record<string, unknown> = {}
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([]))),
      http.post('*/api/companies', async ({ request }) => {
        calls++; body = (await request.json()) as Record<string, unknown>
        return calls === 1 ? HttpResponse.json({ title: 'Conflict', detail: 'A company with this code already exists.' }, { status: 409 }) : HttpResponse.json(company(9), { status: 201 })
      }))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add company' }))
    const dlg = await screen.findByRole('dialog')
    await userEvent.type(within(dlg).getByLabelText(/^Company code/), 'DUP')
    await userEvent.type(within(dlg).getByLabelText(/^Company name/), 'Dup Co')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await within(dlg).findByText('A company with this code already exists.')).toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Company saved')).toBeInTheDocument()
    expect(body).toMatchObject({ companyCode: 'DUP', companyName: 'Dup Co', isActive: true })
  })

  it('opens view mode read-only and edit mode prefilled; edit sends PUT', async () => {
    let put: Record<string, unknown> | null = null
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([company(1)]))),
      http.put('*/api/companies/1', async ({ request }) => { put = (await request.json()) as Record<string, unknown>; return HttpResponse.json(company(1, { companyName: 'Renamed' })) }))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'View C1' }))
    let dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByLabelText(/^Company name/)).toBeDisabled()
    expect(within(dlg).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Edit C1' }))
    dlg = await screen.findByRole('dialog')
    const name = within(dlg).getByLabelText(/^Company name/)
    expect(name).toHaveValue('Company 1')
    await userEvent.clear(name)
    await userEvent.type(name, 'Renamed')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Company saved')).toBeInTheDocument()
    expect(put).toMatchObject({ companyCode: 'C1', companyName: 'Renamed' })
  })

  it('toggles active status through PATCH', async () => {
    let patch: unknown = null
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([company(1)]))),
      http.patch('*/api/companies/1/status', async ({ request }) => { patch = await request.json(); return HttpResponse.json(company(1, { isActive: false })) }))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByLabelText('Deactivate C1'))
    expect(await screen.findByText('Company deactivated')).toBeInTheDocument()
    expect(patch).toEqual({ isActive: false })
  })

  it('confirms deletion and surfaces the 409 guidance for referenced companies', async () => {
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([company(1, { userCount: 2 })]))),
      http.delete('*/api/companies/1', () => HttpResponse.json({ title: 'Conflict', detail: 'This company is referenced by 2 user(s). Deactivate the company instead.' }, { status: 409 })))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete C1' }))
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByText('Delete company?')).toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(/Deactivate the company instead/)).toBeInTheDocument()
  })

  it('cancelling the delete dialog does not call the API', async () => {
    let deleted = false
    server.use(withSession(admin), http.get('*/api/companies', () => HttpResponse.json(paged([company(1)]))), http.delete('*/api/companies/1', () => { deleted = true; return new HttpResponse(null, { status: 204 }) }))
    renderApp(<CompaniesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete C1' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(deleted).toBe(false)
  })
})

describe('validateCompany', () => {
  const ok = { companyCode: 'A', companyName: 'B', isActive: true }
  it('accepts a minimal valid company', () => expect(validateCompany(ok)).toEqual({}))
  it('enforces length limits at the boundary', () => {
    expect(validateCompany({ ...ok, companyCode: 'x'.repeat(30) })).toEqual({})
    expect(validateCompany({ ...ok, companyCode: 'x'.repeat(31) }).companyCode).toBeDefined()
    expect(validateCompany({ ...ok, postalCode: '1'.repeat(21) }).postalCode).toBeDefined()
    expect(validateCompany({ ...ok, phone: '1'.repeat(26) }).phone).toBeDefined()
  })
  it('validates email and http(s) website', () => {
    expect(validateCompany({ ...ok, email: 'bad' }).email).toBeDefined()
    expect(validateCompany({ ...ok, website: 'javascript:alert(1)' }).website).toBeDefined()
    expect(validateCompany({ ...ok, website: 'https://ok.test' })).toEqual({})
  })
})
