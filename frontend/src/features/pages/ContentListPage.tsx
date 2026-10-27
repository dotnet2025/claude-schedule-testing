import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Chip, IconButton, MenuItem, Pagination, Stack, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { pagesApi, postsApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import { formatDate } from '../../utils/format'
import type { ContentSummary } from '../../types'

export type ContentKind = 'pages' | 'posts'

export default function ContentListPage({ kind }: { kind: ContentKind }) {
  const api = kind === 'pages' ? pagesApi : postsApi
  const label = kind === 'pages' ? 'Pages' : 'Posts'
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created'>('updated')
  const [desc, setDesc] = useState(true)
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<ContentSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(() => api.list({ search: q, status, sortBy, desc, page, pageSize: 10 }), [kind, q, status, sortBy, desc, page])

  const sort = (col: 'updated' | 'created') => { if (sortBy === col) setDesc(!desc); else { setSortBy(col); setDesc(true) } }
  const remove = async () => {
    if (!toDelete || busy) return
    setBusy(true)
    try { await api.remove(toDelete.id); toast(`${toDelete.title} deleted`); setToDelete(null); reload() }
    catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const toggle = async (c: ContentSummary) => {
    try { await (c.status === 'Published' ? api.unpublish(c.id) : api.publish(c.id)); toast(c.status === 'Published' ? 'Unpublished' : 'Published'); reload() }
    catch (e) { toast((e as Error).message, 'error') }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography component="h1" variant="h4">{label}</Typography>
        <Button component={RouterLink} to={`/admin/${kind}/new`} variant="contained">New {kind === 'pages' ? 'page' : 'post'}</Button>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField label={`Search ${kind}`} size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <TextField select label="Status" size="small" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem>
        </TextField>
      </Stack>
      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message={`No ${kind} found.`} /> : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Title</TableCell><TableCell>Status</TableCell>
              <TableCell sortDirection={sortBy === 'created' ? (desc ? 'desc' : 'asc') : false}><TableSortLabel active={sortBy === 'created'} direction={desc ? 'desc' : 'asc'} onClick={() => sort('created')}>Created</TableSortLabel></TableCell>
              <TableCell sortDirection={sortBy === 'updated' ? (desc ? 'desc' : 'asc') : false}><TableSortLabel active={sortBy === 'updated'} direction={desc ? 'desc' : 'asc'} onClick={() => sort('updated')}>Updated</TableSortLabel></TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {data.items.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell><RouterLink to={`/admin/${kind}/${c.id}/edit`}>{c.title}</RouterLink><Typography variant="caption" display="block">/{c.slug}</Typography></TableCell>
                  <TableCell><Chip size="small" label={c.status} color={c.status === 'Published' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell><TableCell>{formatDate(c.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => toggle(c)}>{c.status === 'Published' ? 'Unpublish' : 'Publish'}</Button>
                    <IconButton component={RouterLink} to={`/admin/${kind}/${c.id}/edit`} aria-label={`Edit ${c.title}`}><EditIcon fontSize="small" /></IconButton>
                    <IconButton aria-label={`Delete ${c.title}`} color="error" onClick={() => setToDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <ConfirmDialog open={!!toDelete} busy={busy} title={`Delete ${kind === 'pages' ? 'page' : 'post'}?`} message={`"${toDelete?.title}" will be permanently deleted.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
