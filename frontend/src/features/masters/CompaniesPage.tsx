import { useState } from 'react'
import { Box, Button, Chip, IconButton, MenuItem, Pagination, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { companiesApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import type { Company } from '../../types'
import CompanyFormDialog, { type DialogMode } from './CompanyFormDialog'

const PAGE_SIZE = 10

export default function CompaniesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'true' | 'false'>('')
  const [sortBy, setSortBy] = useState('code')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(
    () => companiesApi.list({ search: q, isActive: status === '' ? undefined : status === 'true', sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [q, status, sortBy, sortDir, page])
  const [dialog, setDialog] = useState<{ mode: DialogMode; company: Company | null } | null>(null)
  const [toDelete, setToDelete] = useState<Company | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = async (c: Company) => {
    try { await companiesApi.setStatus(c.companyId, !c.isActive); toast(c.isActive ? 'Company deactivated' : 'Company activated'); reload() }
    catch (e) { toast((e as Error).message, 'error') }
  }
  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try { await companiesApi.remove(toDelete.companyId); toast('Company deleted'); setToDelete(null); reload() }
    catch (e) { toast((e as Error).message, 'error'); setToDelete(null) }
    finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
        <Box>
          <Typography component="h1" variant="h4">Company Master</Typography>
          <Typography color="text.secondary">Manage the companies your users belong to.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'create', company: null })}>Add company</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Search companies" placeholder="Code or name" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ flex: 1 }} />
          <TextField select label="Status" size="small" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1) }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <TextField select label="Sort by" size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="code">Code</MenuItem><MenuItem value="name">Name</MenuItem><MenuItem value="created">Created date</MenuItem>
          </TextField>
          <TextField select label="Order" size="small" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')} sx={{ minWidth: 130 }}>
            <MenuItem value="asc">Ascending</MenuItem><MenuItem value="desc">Descending</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No companies found." /> : (
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Companies">
            <TableHead><TableRow>
              <TableCell>Code</TableCell><TableCell>Name</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Contact</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
              <TableCell align="right">Users</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>{data.items.map((c) => (
              <TableRow key={c.companyId} hover>
                <TableCell>{c.companyCode}</TableCell>
                <TableCell>{c.companyName}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</TableCell>
                <TableCell align="right">{c.userCount}</TableCell>
                <TableCell><Chip size="small" label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={c.isActive ? 'Deactivate' : 'Activate'}>
                    <Switch size="small" checked={c.isActive} onChange={() => toggle(c)} slotProps={{ input: { 'aria-label': `${c.isActive ? 'Deactivate' : 'Activate'} ${c.companyCode}` } }} />
                  </Tooltip>
                  <IconButton aria-label={`View ${c.companyCode}`} onClick={() => setDialog({ mode: 'view', company: c })}><VisibilityIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Edit ${c.companyCode}`} onClick={() => setDialog({ mode: 'edit', company: c })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Delete ${c.companyCode}`} color="error" onClick={() => setToDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Paper>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} aria-label="Companies pagination" />}
      {data && <Typography variant="caption" color="text.secondary">{data.total} compan{data.total === 1 ? 'y' : 'ies'}</Typography>}

      <CompanyFormDialog open={!!dialog} mode={dialog?.mode ?? 'create'} company={dialog?.company ?? null} onClose={() => setDialog(null)}
        onSaved={() => { toast('Company saved'); setDialog(null); reload() }} />
      <ConfirmDialog open={!!toDelete} busy={busy} title="Delete company?" message={`${toDelete?.companyCode} – ${toDelete?.companyName} will be permanently deleted. Companies that still have users cannot be deleted; deactivate them instead.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
