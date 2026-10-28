import type { ReactNode } from 'react'
import { Box, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material'
import { Empty, ErrorView, TableSkeleton } from './StateViews'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Sortable column: pass current state + handler. */
  sort?: { active: boolean; direction: 'asc' | 'desc'; onClick: () => void }
  width?: number | string
  /** Hide this column below the given breakpoint to keep tables compact on phones. */
  hideBelow?: 'sm' | 'md'
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[] | null | undefined
  getKey: (row: T) => string | number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyMessage: string
  emptyAction?: ReactNode
  /** Minimum table width; below it the table scrolls horizontally inside its card (never the page). */
  minWidth?: number
  page?: number
  totalPages?: number
  onPage?: (p: number) => void
  caption?: string
}

/** Reusable data table: loading skeleton, error, empty state, sortable headers, pagination, horizontal scroll on small screens. */
export default function DataTable<T>({ columns, rows, getKey, loading, error, onRetry, emptyMessage, emptyAction, minWidth = 640, page = 1, totalPages = 1, onPage, caption }: Props<T>) {
  const hide = (b?: 'sm' | 'md') => (b === 'sm' ? { display: { xs: 'none', sm: 'table-cell' } } : b === 'md' ? { display: { xs: 'none', md: 'table-cell' } } : undefined)
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {loading ? <TableSkeleton /> : error ? <Box sx={{ px: 2 }}><ErrorView message={error} onRetry={onRetry} /></Box>
        : !rows || rows.length === 0 ? <Empty message={emptyMessage} action={emptyAction} /> : (
          <TableContainer sx={{ overflowX: 'auto' }} tabIndex={0} role="region" aria-label={caption ?? 'Data table'}>
            <Table size="small" sx={{ minWidth }}>
              <TableHead>
                <TableRow>
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align} sx={{ width: c.width, ...hide(c.hideBelow) }}
                      sortDirection={c.sort?.active ? c.sort.direction : false}>
                      {c.sort ? <TableSortLabel active={c.sort.active} direction={c.sort.direction} onClick={c.sort.onClick}>{c.header}</TableSortLabel> : c.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={getKey(r)} hover>
                    {columns.map((c) => <TableCell key={c.key} align={c.align} sx={hide(c.hideBelow)}>{c.render(r)}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      {!loading && !error && onPage && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => onPage(p)} siblingCount={0} />
        </Box>
      )}
    </Paper>
  )
}
