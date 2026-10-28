import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { pagesApi, postsApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import DataTable, { type Column } from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import FilterBar from '../../components/FilterBar'
import StatusChip from '../../components/StatusChip'
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

  const noun = kind === 'pages' ? 'page' : 'post'
  const sortProp = (col: 'updated' | 'created') => ({ active: sortBy === col, direction: (desc ? 'desc' : 'asc') as 'asc' | 'desc', onClick: () => sort(col) })
  const columns: Column<ContentSummary>[] = [
    { key: 'title', header: 'Title', render: (c) => <><RouterLink to={`/admin/${kind}/${c.id}/edit`} style={{ fontWeight: 600 }}>{c.title}</RouterLink><Typography variant="caption" color="text.secondary" display="block">/{c.slug}</Typography></> },
    { key: 'status', header: 'Status', render: (c) => <StatusChip label={c.status} /> },
    { key: 'created', header: 'Created', hideBelow: 'md', sort: sortProp('created'), render: (c) => formatDate(c.createdAt) },
    { key: 'updated', header: 'Updated', hideBelow: 'sm', sort: sortProp('updated'), render: (c) => formatDate(c.updatedAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (c) => (
      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} sx={{ whiteSpace: 'nowrap' }}>
        <Button size="small" onClick={() => toggle(c)}>{c.status === 'Published' ? 'Unpublish' : 'Publish'}</Button>
        <IconButton component={RouterLink} to={`/admin/${kind}/${c.id}/edit`} aria-label={`Edit ${c.title}`}><EditIcon fontSize="small" /></IconButton>
        <IconButton aria-label={`Delete ${c.title}`} color="error" onClick={() => setToDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ]

  return (
    <>
      <PageHeader title={label} subtitle={`Create, edit and publish your site ${kind}.`} breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label }]}
        actions={<Button component={RouterLink} to={`/admin/${kind}/new`} variant="contained" startIcon={<AddIcon />}>New {noun}</Button>} />
      <FilterBar>
        <TextField label={`Search ${kind}`} size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ minWidth: { sm: 280 }, flex: { sm: 1 }, maxWidth: { sm: 420 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        <TextField select label="Status" size="small" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem>
        </TextField>
      </FilterBar>
      <DataTable columns={columns} rows={data?.items} getKey={(c) => c.id} loading={loading} error={error} onRetry={reload} caption={label}
        emptyMessage={`No ${kind} found.`} page={page} totalPages={data?.totalPages} onPage={setPage} minWidth={560} />
      <ConfirmDialog open={!!toDelete} busy={busy} title={`Delete ${noun}?`} message={`"${toDelete?.title}" will be permanently deleted.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}
