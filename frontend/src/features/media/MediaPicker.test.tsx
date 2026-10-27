import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import MediaPicker from './MediaPicker'

const item = { id: 3, originalName: 'cat.png', contentType: 'image/png', size: 10, url: '/api/media/3/file', createdAt: '' }

describe('MediaPicker', () => {
  it('lists media and returns the selected item', async () => {
    server.use(http.get('*/api/media', () => HttpResponse.json({ items: [item], total: 1, page: 1, pageSize: 60, totalPages: 1 })))
    const onSelect = vi.fn()
    renderApp(<MediaPicker open onClose={() => {}} onSelect={onSelect} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Select cat.png' }))
    expect(onSelect).toHaveBeenCalledWith(item)
  })
  it('shows an empty state', async () => {
    server.use(http.get('*/api/media', () => HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 60, totalPages: 0 })))
    renderApp(<MediaPicker open onClose={() => {}} onSelect={() => {}} />)
    expect(await screen.findByText('No media found.')).toBeInTheDocument()
  })
})
