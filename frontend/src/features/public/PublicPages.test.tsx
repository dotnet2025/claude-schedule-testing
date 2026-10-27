import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { BlogPage, NotFoundPage, PostDetailPage } from './PublicPages'

const ui = <Routes><Route path="/blog" element={<BlogPage />} /><Route path="/blog/:slug" element={<PostDetailPage />} /><Route path="*" element={<NotFoundPage />} /></Routes>
const summary = { id: 1, title: 'First post', slug: 'first', summary: 'Excerpt', publishedAt: '2026-01-01T00:00:00Z' }

describe('public site', () => {
  it('renders published posts with pagination controls', async () => {
    server.use(http.get('*/api/public/posts', () => HttpResponse.json({ items: [summary], total: 12, page: 1, pageSize: 6, totalPages: 2 })))
    renderApp(ui, '/blog')
    expect(await screen.findByRole('link', { name: 'First post' })).toHaveAttribute('href', '/blog/first')
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
  it('shows an empty state', async () => {
    server.use(http.get('*/api/public/posts', () => HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 6, totalPages: 0 })))
    renderApp(ui, '/blog')
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument()
  })
  it('renders a post and sets document title and meta description', async () => {
    server.use(
      http.get('*/api/public/posts/first', () => HttpResponse.json({ ...summary, content: '<p>Body text</p>', metaTitle: 'SEO title', metaDescription: 'SEO desc', categories: [], tags: [] })),
      http.get('*/api/public/posts/first/related', () => HttpResponse.json([])),
    )
    renderApp(ui, '/blog/first')
    expect(await screen.findByText('Body text')).toBeInTheDocument()
    expect(document.title).toBe('SEO title')
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', 'SEO desc')
  })
  it('shows 404 when the post is missing (e.g. a draft)', async () => {
    server.use(
      http.get('*/api/public/posts/draft', () => HttpResponse.json({ title: 'Not Found', detail: 'Post not found.' }, { status: 404 })),
      http.get('*/api/public/posts/draft/related', () => HttpResponse.json({}, { status: 404 })),
    )
    renderApp(ui, '/blog/draft')
    expect(await screen.findByText(/404/)).toBeInTheDocument()
  })
  it('shows an error state when the API fails', async () => {
    server.use(http.get('*/api/public/posts', () => HttpResponse.json({ detail: 'Server down' }, { status: 500 })))
    renderApp(ui, '/blog')
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down')
  })
})
