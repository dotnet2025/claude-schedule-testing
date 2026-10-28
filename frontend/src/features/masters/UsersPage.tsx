import { useEffect, useState } from 'react'
import { Box, Button, Chip, IconButton, MenuItem, Pagination, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import KeyIcon from '@mui/icons-material/VpnKey'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { companiesApi, usersApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import { useAuth } from '../../app/AuthContext'
import type { Company, User } from '../../types'
import type { DialogMode } from './CompanyFormDialog'
import UserFormDialog from './UserFormDialog'
import ResetPasswordDialog from './ResetPasswordDialog'

const PAGE_SIZE = 10

export default function UsersPage() {
  const toast = useToast()
  const { user: me } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'' | 'true' | 'false'>('')
  const [companyId, setCompanyId] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [companies, setCompanies] = useState<Company[]>([])
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(
    () => usersApi.list({ search: q, role: role || undefined, isActive: status === '' ? undefined : status === 'true', companyId: companyId ? Number(companyId) : undefined, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [q, role, status, companyId, sortBy, sortDir, page])
  const [dialog, setDialog] = useState<{ mode: DialogMode; user: User | null } | null>(null)
  const [resetFor, setResetFor] = useState<User | null>(null)
  const [toDelete, setToDelete] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { companiesApi.list({ pageSize: 100, sortBy: 'name' }).then((r) => setCompanies(r.items)).catch(() => { /* filter is optional */ }) }, [])

  const filter = <T,>(set: (v: T) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { set(e.target.value as T); setPage(1) }
  const toggle = async (u: User) => {
    try { await usersApi.setStatus(u.id, !u.isActive); toast(u.isActive ? 'User deactivated' : 'User activated'); reload() }
    catch (e) { toast((e as Error).message, 'error') }
  }
  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try { await usersApi.remove(toDelete.id); toast('User deleted'); setToDelete(null); reload() }
    catch (e) { toast((e as Error).message, 'error'); setToDelete(null) }
    finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
        <Box>
          <Typography component="h1" variant="h4">User Master</Typography>
          <Typography color="text.secondary">Manage accounts, roles and access.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'create', user: null })}>Add user</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Search users" placeholder="Name, email or username" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ flex: 1 }} />
          <TextField select label="Role" size="small" value={role} onChange={filter(setRole)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="Admin">Admin</MenuItem><MenuItem value="Editor">Editor</MenuItem>
          </TextField>
          <TextField select label="Status" size="small" value={status} onChange={filter(setStatus)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <TextField select label="Company" size="small" value={companyId} onChange={filter(setCompanyId)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>{companies.map((c) => <MenuItem key={c.companyId} value={String(c.companyId)}>{c.companyName}</MenuItem>)}
          </TextField>
          <TextField select label="Sort by" size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="name">Name</MenuItem><MenuItem value="email">Email</MenuItem><MenuItem value="username">Username</MenuItem>
            <MenuItem value="role">Role</MenuItem><MenuItem value="created">Created date</MenuItem><MenuItem value="lastlogin">Last login</MenuItem>
          </TextField>
          <TextField select label="Order" size="small" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')} sx={{ minWidth: 130 }}>
            <MenuItem value="asc">Ascending</MenuItem><MenuItem value="desc">Descending</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No users found." /> : (
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Users">
            <TableHead><TableRow>
              <TableCell>Name</TableCell><TableCell>Email</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Username</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Company</TableCell>
              <TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>{data.items.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.displayName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{u.username}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{u.companyName ?? '—'}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={u.role} color={u.role === 'Admin' ? 'primary' : 'default'} /></TableCell>
                <TableCell><Chip size="small" label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={u.id === me?.id ? 'You cannot deactivate yourself' : u.isActive ? 'Deactivate' : 'Activate'}>
                    <span><Switch size="small" checked={u.isActive} disabled={u.id === me?.id} onChange={() => toggle(u)} slotProps={{ input: { 'aria-label': `${u.isActive ? 'Deactivate' : 'Activate'} ${u.email}` } }} /></span>
                  </Tooltip>
                  <IconButton aria-label={`View ${u.email}`} onClick={() => setDialog({ mode: 'view', user: u })}><VisibilityIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Edit ${u.email}`} onClick={() => setDialog({ mode: 'edit', user: u })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Reset password ${u.email}`} onClick={() => setResetFor(u)}><KeyIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Delete ${u.email}`} color="error" onClick={() => setToDelete(u)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Paper>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} aria-label="Users pagination" />}
      {data && <Typography variant="caption" color="text.secondary">{data.total} user{data.total === 1 ? '' : 's'}</Typography>}

      <UserFormDialog open={!!dialog} mode={dialog?.mode ?? 'create'} user={dialog?.user ?? null} onClose={() => setDialog(null)}
        onSaved={() => { toast('User saved'); setDialog(null); reload() }} />
      <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} onDone={() => { toast('Password reset'); setResetFor(null) }} />
      <ConfirmDialog open={!!toDelete} busy={busy} title="Delete user?" message={`${toDelete?.email} will be permanently deleted. Users who authored content or audit records cannot be deleted; deactivate them instead.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
