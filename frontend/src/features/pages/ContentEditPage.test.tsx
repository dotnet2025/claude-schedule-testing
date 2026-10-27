import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, withSession } from '../../test/handlers'
import ContentEditPage, { validate } from './ContentEditPage'

vi.mock('../../components/RichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => <textarea aria-label="Content" value={value} onChange={(e) => onChange(e.target.value)} />,
}))

const saved = { id: 5, title: 'About', slug: 'about', content: '', status: 'Draft', createdAt: '', updatedAt: '', categories: [], tags: [], concurrencyStamp: 'abc' }

describe('validate()', () => {
  it('flags required, long and malformed values', () => {
    expect(validate({ title: '', slug: '', metaTitle: '', metaDescription: '' }).title).toBeDefined()
    expect(validate({ title: 'x'.repeat(201), slug: '', metaTitle: '', metaDescription: '' }).title).toMatch(/200/)
    expect(validate({ title: 'ok', slug: 'Bad Slug', metaTitle: '', metaDescription: '' }).slug).toBeDefined()
    expect(validate({ title: 'ok', slug: 'good-slug', metaTitle: '', metaDescription: '' })).toEqual({})
  })
})

describe('ContentEditPage (pages)', () => {
  const ui = <Routes><Route path="/admin/pages/new" element={<ContentEditPage kind="pages" />} /><Route path="/admin/pages/:id/edit" element={<h1>Edit screen</h1>} /></Routes>

  it('blocks submit when the title is empty', async () => {
    let posted = false
    server.use(withSession(admin), http.post('*/api/pages', () => { posted = true; return HttpResponse.json(saved, { status: 201 }) }))
    renderApp(ui, '/admin/pages/new')
    await userEvent.click(await screen.findByRole('button', { name: /save draft/i }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(posted).toBe(false)
  })

  it('auto-generates the slug, posts the form once and navigates to edit', async () => {
    let count = 0; let payload: Record<string, unknown> = {}
    server.use(withSession(admin), http.post('*/api/pages', async ({ request }) => { count++; payload = (await request.json()) as Record<string, unknown>; return HttpResponse.json(saved, { status: 201 }) }))
    renderApp(ui, '/admin/pages/new')
    await userEvent.type(await screen.findByLabelText(/^title/i), 'About Us!')
    expect(screen.getByLabelText(/^slug/i)).toHaveValue('about-us')
    const btn = screen.getByRole('button', { name: /save draft/i })
    await userEvent.dblClick(btn)
    expect(await screen.findByText('Edit screen')).toBeInTheDocument()
    expect(count).toBe(1)
    expect(payload).toMatchObject({ title: 'About Us!', slug: 'about-us' })
  })

  it('shows the server error for duplicate slugs', async () => {
    server.use(withSession(admin), http.post('*/api/pages', () => HttpResponse.json({ title: 'Conflict', detail: "Slug 'about' is already in use." }, { status: 409 })))
    renderApp(ui, '/admin/pages/new')
    await userEvent.type(await screen.findByLabelText(/^title/i), 'About')
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }))
    expect(await screen.findByText("Slug 'about' is already in use.")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /save draft/i })).toBeEnabled())
  })
})
