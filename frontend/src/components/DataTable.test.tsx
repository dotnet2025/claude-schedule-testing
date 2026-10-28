import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataTable, { type Column } from './DataTable'

interface Row { id: number; name: string }
const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name, sort: { active: true, direction: 'asc', onClick: vi.fn() } },
]

describe('DataTable', () => {
  it('renders rows and pagination', async () => {
    const onPage = vi.fn()
    render(<DataTable columns={columns} rows={[{ id: 1, name: 'Alpha' }]} getKey={(r) => r.id} emptyMessage="Nothing" page={1} totalPages={3} onPage={onPage} />)
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /page 2/i }))
    expect(onPage).toHaveBeenCalledWith(2)
  })
  it('shows loading, error and empty states', () => {
    const { rerender } = render(<DataTable columns={columns} rows={null} getKey={(r) => r.id} loading emptyMessage="Nothing" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(<DataTable columns={columns} rows={null} getKey={(r) => r.id} error="Boom" emptyMessage="Nothing" />)
    expect(screen.getByText('Boom')).toBeInTheDocument()
    rerender(<DataTable columns={columns} rows={[]} getKey={(r) => r.id} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})
